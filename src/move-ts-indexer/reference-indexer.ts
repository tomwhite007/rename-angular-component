import * as fs from 'fs-extra-promise';
import * as path from 'path';
import * as ts from 'typescript';
import * as vscode from 'vscode';
import { FileItem } from './file-item';
import {
  isPathToAnotherDir,
  mergeReferenceArrays,
  Reference,
  ReferenceIndex,
} from './reference-index';
import {
  applyGenericEdits,
  GenericEdit,
  GenericEditsCallback,
} from './apply-generic-edits';
import * as minimatch from 'minimatch';
import { config } from 'bluebird';

const BATCH_SIZE = 50;

type Replacement = [string, string];

interface FoundItem {
  itemType:
    | 'importPath'
    | 'exportPath'
    | 'class'
    | 'selector'
    | 'templateUrl'
    | 'styleUrls';
  itemText: string;
  specifiers?: string[];
  location: { start: number; end: number };
}

type ConfigProp = object | string | undefined;

interface ConfigInfo {
  config: {
    extends?: string;
    compilerOptions: {
      baseUrl: string;
      paths: {
        [key: string]: string[];
      };
      [key: string]: ConfigProp;
    };
    [key: string]: ConfigProp;
  };
  configPath: string;
}

export function isInDir(dir: string, p: string) {
  const relative = path.relative(dir, p);
  return !isPathToAnotherDir(relative);
}

export function asUnix(fsPath: string) {
  return fsPath.replace(/\\/g, '/');
}

export class ReferenceIndexer {
  index: ReferenceIndex = new ReferenceIndex();
  isinitialised: boolean = false;
  changeDocumentEvent!: vscode.Disposable;
  debugLogToFile?: (...args: string[]) => void;

  private tsconfigs!: { [key: string]: any };
  private output!: vscode.OutputChannel;
  private packageNames: { [key: string]: string } = {};
  private extensions: string[] = ['.ts'];
  private fileWatcher!: vscode.FileSystemWatcher;

  constructor(output: vscode.OutputChannel) {
    this.output = output;
  }

  init(progress?: vscode.Progress<{ message: string }>): Thenable<any> {
    this.index = new ReferenceIndex();

    return this.readPackageNames().then(() => {
      return this.scanAll(progress)
        .then(() => {
          return this.attachFileWatcher();
        })
        .then(() => {
          console.log('indexer initialised');
          this.isinitialised = true;
        });
    });
  }

  conf<T>(property: string, defaultValue: T): T {
    return vscode.workspace
      .getConfiguration('renameAngularComponent')
      .get<T>(property, defaultValue);
  }

  private readPackageNames(): Thenable<any> {
    this.packageNames = {};
    this.tsconfigs = {};
    let seenPackageNames: { [key: string]: boolean } = {};
    const packagePromise = vscode.workspace
      .findFiles('**/package.json', '**/node_modules/**', 1000)
      .then((files) => {
        const promises = files.map((file) => {
          return fs.readFileAsync(file.fsPath, 'utf-8').then((content) => {
            try {
              let json = JSON.parse(content);
              if (json.name) {
                if (seenPackageNames[json.name]) {
                  delete this.packageNames[json.name];
                  return;
                }
                seenPackageNames[json.name] = true;
                this.packageNames[json.name] = path.dirname(file.fsPath);
              }
            } catch (e) {}
          });
        });
        return Promise.all(promises);
      });
    const tsConfigPromise = vscode.workspace
      .findFiles(
        '**/tsconfig{.json,.build.json,.base.json}',
        '**/node_modules/**',
        1000
      )
      .then((files) => {
        const promises = files.map((file) => {
          return fs.readFileAsync(file.fsPath, 'utf-8').then((content) => {
            try {
              const config = ts.parseConfigFileTextToJson(file.fsPath, content);
              if (config.config) {
                this.tsconfigs[file.fsPath] = config.config;
              }
            } catch (e) {}
          });
        });
        return Promise.all(promises);
      });
    return Promise.all([packagePromise, tsConfigPromise]);
  }

  startNewMoves(moves: FileItem[]) {
    this.output.appendLine('Files changed:');
  }

  private readonly filesToScanGlob = '**/*.ts';

  private scanAll(progress?: vscode.Progress<{ message: string }>) {
    this.index = new ReferenceIndex();
    const start = Date.now();
    return vscode.workspace
      .findFiles(this.filesToScanGlob, '**/node_modules/**', 100000)
      .then((files) => {
        return this.processWorkspaceFiles(files, false, progress);
      })
      .then(() => {
        console.log('scan finished in ' + (Date.now() - start) + 'ms');
        console.log(`Indexed ${this.index.fileCount()} files`);
      });
  }

  private attachFileWatcher(): void {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
    }
    if (this.changeDocumentEvent) {
      this.changeDocumentEvent.dispose();
    }
    this.changeDocumentEvent = vscode.workspace.onDidChangeTextDocument(
      (changeEvent) => {
        addBatch(changeEvent.document.uri, changeEvent.document);
      }
    );
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(
      this.filesToScanGlob
    );

    const watcher = this.fileWatcher;
    const batch: string[] = [];
    const documents: vscode.TextDocument[] = [];
    let batchTimeout: any = undefined;

    const batchHandler = () => {
      batchTimeout = undefined;

      vscode.workspace
        .findFiles(this.filesToScanGlob, '**/node_modules/**', 10000)
        .then((files) => {
          const b = new Set(batch.splice(0, batch.length));
          if (b.size) {
            this.processWorkspaceFiles(
              files.filter((f) => b.has(f.fsPath)),
              true
            );
          }
          const docs = documents.splice(0, documents.length);
          if (docs.length) {
            this.processDocuments(docs);
          }
        });
    };

    const addBatch = (file: vscode.Uri, doc?: vscode.TextDocument) => {
      if (doc) {
        documents.push(doc);
      } else {
        batch.push(file.fsPath);
      }
      if (batchTimeout) {
        clearTimeout(batchTimeout);
        batchTimeout = undefined;
      }
      batchTimeout = setTimeout(batchHandler, 250);
    };

    watcher.onDidChange(addBatch);
    watcher.onDidCreate(addBatch);
    watcher.onDidDelete((file: vscode.Uri) => {
      this.index.deleteByPath(file.fsPath);
    });
  }

  private getReferenceEdits(
    filePath: string,
    text: string,
    replacements: Replacement[],
    fromPath?: string
  ): GenericEdit[] {
    const edits: GenericEdit[] = [];
    const relativeReferences = this.getRelativeReferences(
      text,
      fromPath || filePath
    );
    replacements.forEach((replacement) => {
      const before = replacement[0];
      const after = replacement[1];
      if (before === after) {
        return;
      }
      const beforeReference = this.resolveRelativeReference(
        fromPath || filePath,
        before
      );
      const seen: any = {};
      const beforeReplacements = relativeReferences.filter((ref) => {
        return (
          this.resolveRelativeReference(fromPath || filePath, ref.itemText) ===
          beforeReference
        );
      });
      beforeReplacements.forEach((beforeReplacement) => {
        const edit = {
          start: beforeReplacement.location.start + 1,
          end: beforeReplacement.location.end - 1,
          replacement: after,
        };
        edits.push(edit);
      });
    });

    return edits;
  }

  private replaceEdits(
    filePath: string,
    getEdits: (filePath: string, text: string) => GenericEdit[]
  ): Thenable<any> {
    // TODO: refactor to not use editors unless unsaved
    if (!this.conf('openEditors', false)) {
      return fs.readFileAsync(filePath, 'utf8').then((text) => {
        const edits = getEdits(filePath, text);
        if (edits.length === 0) {
          return Promise.resolve();
        }

        let newText = applyGenericEdits(text, edits);

        this.output.show();
        this.output.appendLine(filePath);

        return fs.writeFileAsync(filePath, newText, 'utf-8').then(() => {
          this.processFile(newText, filePath, true);
        });
      });
    } else {
      function attemptEdit(
        edit: vscode.WorkspaceEdit,
        attempts: number = 0
      ): Thenable<any> {
        return vscode.workspace.applyEdit(edit).then((success) => {
          if (!success && attempts < 5) {
            console.log(attempts);
            return attemptEdit(edit, attempts + 1);
          }
        });
      }

      return vscode.workspace
        .openTextDocument(filePath)
        .then((doc: vscode.TextDocument): Thenable<any> => {
          const text = doc.getText();
          const rawEdits = getEdits(filePath, text);
          const edits = rawEdits.map((edit: GenericEdit) => {
            return vscode.TextEdit.replace(
              new vscode.Range(
                doc.positionAt(edit.start),
                doc.positionAt(edit.end)
              ),
              edit.replacement
            );
          });
          if (edits.length > 0) {
            this.output.show();
            this.output.appendLine(filePath);
            const edit = new vscode.WorkspaceEdit();
            edit.set(doc.uri, edits);
            return attemptEdit(edit).then(() => {
              const newText = applyGenericEdits(text, rawEdits);
              this.processFile(newText, filePath, true);
            });
          } else {
            return Promise.resolve();
          }
        });
    }
  }

  updateMovedFile(
    from: string,
    to: string,
    additionalEdits?: GenericEditsCallback
  ): Thenable<any> {
    const replacements = (text: string): Replacement[] => {
      const references = Array.from(
        new Set(this.getRelativeImportSpecifiers(text, from))
      );

      return references.map((reference): [string, string] => {
        const absReference = this.resolveRelativeReference(
          from,
          reference.path
        );
        const newReference = this.getRelativePath(to, absReference);
        return [reference.path, newReference];
      });
    };

    return this.replaceEdits(
      to,
      (filePath: string, text: string): GenericEdit[] => [
        ...this.getReferenceEdits(filePath, text, replacements(text), from),
        ...(additionalEdits ? additionalEdits(filePath, text) : []),
      ]
    ).then(() => {
      this.index.deleteByPath(from);
    });
  }

  updateMovedDir(
    from: string,
    to: string,
    fileNames: string[] = []
  ): Thenable<any> {
    const relative = vscode.workspace.asRelativePath(to);
    const glob = this.filesToScanGlob;
    const whiteList = new Set<string>(fileNames);
    return vscode.workspace
      .findFiles(relative + '/**', undefined, 100000)
      .then((files) => {
        const promises = files
          .filter((file) => {
            if (whiteList.size > 0) {
              return (
                minimatch(file.fsPath, glob) &&
                whiteList.has(path.relative(to, file.fsPath).split(path.sep)[0])
              );
            }
            return minimatch(file.fsPath, glob);
          })
          .map((file) => {
            const originalPath = path.resolve(
              from,
              path.relative(to, file.fsPath)
            );

            const replacements = (text: string): Replacement[] => {
              const references = this.getRelativeImportSpecifiers(
                text,
                file.fsPath
              );
              const change = references
                .filter((p) => {
                  const abs = this.resolveRelativeReference(
                    originalPath,
                    p.path
                  );
                  if (whiteList.size > 0) {
                    const name = path.relative(from, abs).split(path.sep)[0];
                    if (whiteList.has(name)) {
                      return false;
                    }
                    for (let i = 0; i < this.extensions.length; i++) {
                      if (whiteList.has(name + this.extensions[i])) {
                        return false;
                      }
                    }
                    return true;
                  }
                  return isPathToAnotherDir(path.relative(from, abs));
                })
                .map((p): Replacement => {
                  const abs = this.resolveRelativeReference(
                    originalPath,
                    p.path
                  );
                  const relative = this.getRelativePath(file.fsPath, abs);
                  return [p.path, relative];
                });
              return change;
            };

            return this.replaceEdits(
              file.fsPath,
              (filePath: string, text: string): GenericEdit[] => {
                return this.getReferenceEdits(
                  filePath,
                  text,
                  replacements(text),
                  originalPath
                );
              }
            );
          });
        return Promise.all(promises);
      });
  }

  updateDirImports(
    from: string,
    to: string,
    fileNames: string[] = []
  ): Thenable<any> {
    const whiteList = new Set(fileNames);
    const affectedFiles = this.index.getDirReferences(from, fileNames);
    const promises = affectedFiles.map((reference) => {
      const replacements = (text: string): Replacement[] => {
        const imports = this.getRelativeImportSpecifiers(text, reference.path);
        const change = imports
          .filter((p) => {
            const abs = this.resolveRelativeReference(reference.path, p.path);
            if (fileNames.length > 0) {
              const name = path.relative(from, abs).split(path.sep)[0];
              if (whiteList.has(name)) {
                return true;
              }
              for (let i = 0; i < this.extensions.length; i++) {
                if (whiteList.has(name + this.extensions[i])) {
                  return true;
                }
              }
              return false;
            }
            return !isPathToAnotherDir(path.relative(from, abs));
          })
          .map((p): [string, string] => {
            const abs = this.resolveRelativeReference(reference.path, p.path);
            const relative = path.relative(from, abs);
            const newabs = path.resolve(to, relative);
            const changeTo = this.getRelativePath(reference.path, newabs);
            return [p.path, changeTo];
          });
        return change;
      };

      return this.replaceEdits(
        reference.path,
        (filePath: string, text: string): GenericEdit[] => {
          return this.getReferenceEdits(filePath, text, replacements(text));
        }
      );
    });
    return Promise.all(promises);
  }

  removeExtension(filePath: string): string {
    let ext = path.extname(filePath);
    if (ext === '.ts' && filePath.endsWith('.d.ts')) {
      ext = '.d.ts';
    }
    if (this.extensions.indexOf(ext) >= 0) {
      return filePath.slice(0, -ext.length);
    }
    return filePath;
  }

  removeIndexSuffix(filePath: string): string {
    const indexSuffix = '/index';
    if (filePath.endsWith(indexSuffix)) {
      return filePath.slice(0, -indexSuffix.length);
    }
    return filePath;
  }

  updateImports(
    from: string,
    to: string,
    exportedNameToChange?: string,
    additionalEdits?: GenericEditsCallback
  ): Promise<any> {
    let affectedFiles = this.index.getReferences(from);
    affectedFiles = this.addAffectedByBarrels(
      affectedFiles,
      exportedNameToChange
    );

    if (additionalEdits && !affectedFiles.find((ref) => ref.path === from)) {
      affectedFiles.push({ path: from, specifiers: [] });
    }

    const promises = affectedFiles.map((filePath) => {
      const replacements = (text: string): Replacement[] => {
        let relative = this.getRelativePath(filePath.path, from);
        relative = this.removeExtension(relative);

        let newRelative = this.getRelativePath(filePath.path, to);
        newRelative = this.removeExtension(newRelative);
        newRelative = this.removeIndexSuffix(newRelative);

        return [[relative, newRelative]];
      };

      return this.replaceEdits(
        filePath.path,
        (filePath: string, text: string): GenericEdit[] => [
          ...this.getReferenceEdits(filePath, text, replacements(text)),
          ...(additionalEdits ? additionalEdits(filePath, text) : []),
        ]
      );
    });
    return Promise.all(promises).catch((e) => {
      if (this.debugLogToFile) {
        this.debugLogToFile(
          '',
          'updateImports error',
          JSON.stringify(e, Object.getOwnPropertyNames(e))
        );
      }
      console.log(e);
    });
  }

  private addAffectedByBarrels(
    affectedFiles: Reference[],
    exportedNameToChange?: string
  ) {
    // WHY IS exportedNameToChange EMPTY!!!???
    if (!exportedNameToChange) {
      return affectedFiles;
    }
    const barrels = affectedFiles.filter((ref) => ref.isExport);
    const affectedFromBarrelArrays = barrels.map((ref) =>
      this.index
        .getReferences(ref.path)
        .filter((barrelRef) =>
          barrelRef.specifiers.includes(exportedNameToChange)
        )
    );
    const affectedFromBarrel = affectedFromBarrelArrays.reduce(
      (acc, val) => acc.concat(val),
      []
    );
    affectedFiles = mergeReferenceArrays(affectedFiles, affectedFromBarrel);
    return affectedFiles;
  }

  private processWorkspaceFiles(
    files: vscode.Uri[],
    deleteByFile: boolean = false,
    progress?: vscode.Progress<{
      message: string;
    }>
  ): Promise<any> {
    files = files.filter((f) => {
      return (
        f.fsPath.indexOf('typings') === -1 &&
        f.fsPath.indexOf('node_modules') === -1 &&
        f.fsPath.indexOf('jspm_packages') === -1
      );
    });

    return new Promise((resolve) => {
      let index = 0;

      const next = () => {
        for (let i = 0; i < BATCH_SIZE && index < files.length; i++) {
          const file = files[index++];
          try {
            const data = fs.readFileSync(file.fsPath, 'utf8');
            this.processFile(data, file.fsPath, deleteByFile);
          } catch (e) {
            console.log('Failed to load file', e);
          }
        }

        if (progress) {
          progress.report({
            message: index + '/' + files.length + ' indexed',
          });
        }

        if (index < files.length) {
          setTimeout(next, 0);
        } else {
          resolve(true);
        }
      };
      next();
    });
  }

  private processDocuments(documents: vscode.TextDocument[]): Promise<any> {
    documents = documents.filter((doc) => {
      return (
        doc.uri.fsPath.indexOf('typings') === -1 &&
        doc.uri.fsPath.indexOf('node_modules') === -1 &&
        doc.uri.fsPath.indexOf('jspm_packages') === -1
      );
    });

    return new Promise((resolve) => {
      let index = 0;

      const next = () => {
        for (let i = 0; i < BATCH_SIZE && index < documents.length; i++) {
          const doc = documents[index++];
          try {
            const data = doc.getText();
            this.processFile(data, doc.uri.fsPath, false);
          } catch (e) {
            console.log('Failed to load file', e);
          }
        }
        if (index < documents.length) {
          setTimeout(next, 0);
        } else {
          resolve(true);
        }
      };
      next();
    });
  }

  private doesFileExist(filePath: string) {
    if (fs.existsSync(filePath)) {
      return true;
    }
    for (let i = 0; i < this.extensions.length; i++) {
      if (fs.existsSync(filePath + this.extensions[i])) {
        return true;
      }
    }
    return false;
  }

  private getRelativePath(from: string, to: string): string {
    const configInfo = this.getTsConfig(from);
    if (configInfo) {
      const config = configInfo.config;
      const configPath = configInfo.configPath;
      if (
        config.compilerOptions &&
        config.compilerOptions.paths &&
        config.compilerOptions.baseUrl
      ) {
        const baseUrl = path.resolve(
          path.dirname(configPath),
          config.compilerOptions.baseUrl
        );
        for (let p in config.compilerOptions.paths) {
          const paths = config.compilerOptions.paths[p];
          for (let i = 0; i < paths.length; i++) {
            const mapped = paths[i].slice(0, -1);
            const mappedDir = path.resolve(baseUrl, mapped);
            if (isInDir(mappedDir, to)) {
              return asUnix(p.slice(0, -1) + path.relative(mappedDir, to));
            }
          }
        }
      }
    }
    for (let packageName in this.packageNames) {
      const packagePath = this.packageNames[packageName];
      if (isInDir(packagePath, to) && !isInDir(packagePath, from)) {
        return asUnix(path.join(packageName, path.relative(packagePath, to)));
      }
    }
    // TODO: validate if doesn't have any future benefit, then remove
    const relativeToTsConfig = this.conf('relativeToTsconfig', false);
    if (relativeToTsConfig && configInfo) {
      const configDir = path.dirname(configInfo.configPath);
      if (isInDir(configDir, from) && isInDir(configDir, to)) {
        return asUnix(path.relative(configDir, to));
      }
    }
    let relative = path.relative(path.dirname(from), to);
    if (!relative.startsWith('.')) {
      relative = './' + relative;
    }
    return asUnix(relative);
  }

  private resolveRelativeReference(fsPath: string, reference: string): string {
    if (reference.startsWith('.')) {
      return path.resolve(path.dirname(fsPath), reference);
    } else {
      const configInfo = this.getTsConfig(fsPath);
      if (configInfo) {
        const config = configInfo.config;
        const configPath = configInfo.configPath;
        // TODO: validate if doesn't have any future benefit, then remove
        const relativeToTsConfig = this.conf('relativeToTsconfig', false);
        if (relativeToTsConfig && configPath) {
          const check = path.resolve(path.dirname(configPath), reference);
          if (this.doesFileExist(check)) {
            return check;
          }
        }
        if (
          config.compilerOptions &&
          config.compilerOptions.paths &&
          config.compilerOptions.baseUrl
        ) {
          const baseUrl = path.resolve(
            path.dirname(configPath),
            config.compilerOptions.baseUrl
          );
          for (let p in config.compilerOptions.paths) {
            // wildcard path mappings
            if (p.endsWith('*') && reference.startsWith(p.slice(0, -1))) {
              const paths = config.compilerOptions.paths[p];
              for (let i = 0; i < paths.length; i++) {
                const mapped = paths[i].slice(0, -1);
                const mappedDir = path.resolve(baseUrl, mapped);
                const potential = path.join(
                  mappedDir,
                  reference.substr(p.slice(0, -1).length)
                );
                if (this.doesFileExist(potential)) {
                  return potential;
                }
              }
              if (config.compilerOptions.paths[p].length === 1) {
                const mapped = config.compilerOptions.paths[p][0].slice(0, -1);
                const mappedDir = path.resolve(
                  path.dirname(configPath),
                  mapped
                );
                return path.join(
                  mappedDir,
                  reference.substr(p.slice(0, -1).length)
                );
              }
            } else {
              // fixed path mappings
              if (p === reference) {
                const paths = config.compilerOptions.paths[p];
                for (let i = 0; i < paths.length; i++) {
                  const potential = path.resolve(baseUrl, paths[i]);
                  if (this.doesFileExist(potential)) {
                    return potential;
                  }
                }
              }
            }
          }

          // non-relative base url paths
          const potential = path.resolve(baseUrl, reference);
          if (this.doesFileExist(potential)) {
            return potential;
          }
        }
        for (let packageName in this.packageNames) {
          if (reference.startsWith(packageName + '/')) {
            return path.resolve(
              this.packageNames[packageName],
              reference.substr(packageName.length + 1)
            );
          }
        }
      }
    }

    return '';
  }

  private getTsConfig(filePath: string): ConfigInfo | null {
    let prevDir = filePath;
    let dir = path.dirname(filePath);
    while (dir !== prevDir) {
      const tsConfigPaths = [
        path.join(dir, 'tsconfig.json'),
        path.join(dir, 'tsconfig.build.json'),
        path.join(dir, 'tsconfig.base.json'),
      ];
      const tsConfigPath = tsConfigPaths.find((p) =>
        this.tsconfigs.hasOwnProperty(p)
      );

      if (tsConfigPath) {
        const configInfo = {
          config: this.tsconfigs[tsConfigPath],
          configPath: tsConfigPath,
        };

        if (configInfo.config.extends) {
          return this.extendedConfigInfo(configInfo);
        }

        return configInfo;
      }
      prevDir = dir;
      dir = path.dirname(dir);
    }
    return null;
  }

  private extendedConfigInfo(extenderConfigInfo: ConfigInfo): ConfigInfo {
    const configDir = path.dirname(extenderConfigInfo.configPath);
    const baseConfigPath = path.join(
      configDir,
      extenderConfigInfo.config.extends as string
    );

    if (this.tsconfigs.hasOwnProperty(baseConfigPath)) {
      const baseConfigInfo: ConfigInfo = {
        config: this.tsconfigs[baseConfigPath],
        configPath: baseConfigPath,
      };
      const merged = this.mergeConfigs(extenderConfigInfo, baseConfigInfo);
      if (baseConfigInfo.config.extends) {
        // recurse next level of extension
        return this.extendedConfigInfo(merged);
      }
      return merged;
    } else {
      return extenderConfigInfo;
    }
  }

  private mergeConfigs(
    extenderConfigInfo: ConfigInfo,
    baseConfigInfo: ConfigInfo
  ): ConfigInfo {
    return {
      config: {
        ...extenderConfigInfo.config,
        compilerOptions: {
          ...baseConfigInfo.config?.compilerOptions,
          ...extenderConfigInfo.config.compilerOptions,
          // TODO: work out if paths needs to merge and how extender's need to adapt
          paths: baseConfigInfo.config?.compilerOptions.paths,
          // TODO: work out what happens with two base urls and base's paths
          baseUrl: baseConfigInfo.config?.compilerOptions.baseUrl,
        },
        extends: undefined,
      },
      configPath: baseConfigInfo.configPath,
    };
  }

  private getRelativeImportSpecifiers(
    data: string,
    filePath: string
  ): Reference[] {
    return this.getRelativeReferences(data, filePath).map((ref) => ({
      path: ref.itemText,
      specifiers: ref.specifiers ?? [],
      isExport: ref.itemType === 'exportPath',
    }));
  }

  private getReferences(fileName: string, data: string): FoundItem[] {
    const result: FoundItem[] = [];
    const file = ts.createSourceFile(fileName, data, ts.ScriptTarget.Latest);

    file.statements.forEach((node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        if (ts.isStringLiteral(node.moduleSpecifier)) {
          const bindings = node.importClause?.namedBindings;
          const specifiers =
            bindings && ts.isNamedImports(bindings)
              ? bindings.elements.map((elem) => elem.name.text)
              : [];
          result.push({
            itemType: 'importPath',
            itemText: node.moduleSpecifier.text,
            specifiers,
            location: {
              start: node.moduleSpecifier.getStart(file),
              end: node.moduleSpecifier.getEnd(),
            },
          });
        }
      } else if (ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          result.push({
            itemType: 'exportPath',
            itemText: node.moduleSpecifier.text,
            location: {
              start: node.moduleSpecifier.getStart(file),
              end: node.moduleSpecifier.getEnd(),
            },
          });
        }
      }
    });

    return result;
  }

  private getRelativeReferences(data: string, filePath: string): FoundItem[] {
    const references: Set<string> = new Set();
    let cachedConfig: any = undefined;
    const getConfig = () => {
      if (cachedConfig === undefined) {
        cachedConfig = this.getTsConfig(filePath);
      }
      return cachedConfig;
    };
    const imports = this.getReferences(filePath, data);
    for (let i = 0; i < imports.length; i++) {
      const importModule = imports[i].itemText;
      if (importModule.startsWith('.')) {
        references.add(importModule);
      } else {
        const resolved = this.resolveRelativeReference(filePath, importModule);
        if (resolved.length > 0) {
          references.add(importModule);
        }
      }
    }
    return imports.filter((i) => references.has(i.itemText));
  }

  private processFile(
    data: string,
    filePath: string,
    deleteByFile: boolean = false
  ) {
    if (deleteByFile) {
      this.index.deleteByPath(filePath);
    }

    const fsPath = this.removeExtension(filePath);

    const references = this.getRelativeImportSpecifiers(data, fsPath);

    for (let i = 0; i < references.length; i++) {
      let referenced = this.resolveRelativeReference(
        filePath,
        references[i].path
      );
      for (let j = 0; j < this.extensions.length; j++) {
        const ext = this.extensions[j];
        if (!referenced.endsWith(ext) && fs.existsSync(referenced + ext)) {
          referenced += ext;
        }
      }
      this.index.addReference(
        referenced,
        filePath,
        references[i].specifiers,
        references[i].isExport
      );
    }
  }
}
