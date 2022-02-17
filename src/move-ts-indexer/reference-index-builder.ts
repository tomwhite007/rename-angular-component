import * as fs from 'fs-extra-promise';
import * as path from 'path';
import * as ts from 'typescript';
import * as vscode from 'vscode';
import { ReferenceIndex } from './reference-index';
import {
  applyGenericEdits,
  GenericEdit,
  GenericEditsCallback,
} from './apply-generic-edits';
import * as minimatch from 'minimatch';
import {
  isPathToAnotherDir,
  mergeReferenceArrays,
  asUnix,
  isInDir,
  conf,
  flattenArray,
} from './util/helper-functions';
import { Reference } from './util/shared-interfaces';

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

export class ReferenceIndexBuilder {
  index: ReferenceIndex = new ReferenceIndex();
  isinitialised: boolean = false;
  changeDocumentEvent!: vscode.Disposable;

  private tsConfigs!: { [key: string]: ConfigInfo };
  private packageNames: { [key: string]: string } = {};
  private readonly extensions: string[] = ['.ts'];
  private fileWatcher!: vscode.FileSystemWatcher;
  private fileEditLog: string[] = [];

  constructor(private debugLogger: { log: (...args: string[]) => void }) {}

  async init(progress?: vscode.Progress<{ message: string }>) {
    this.debugLogger.log('## Debug Indexer Start ###');
    this.index = new ReferenceIndex();

    await this.readPackageNames();
    this.debugLogger.log('tsConfigs: ', JSON.stringify(this.tsConfigs));
    await this.scanAll(progress);
    this.attachFileWatcher();
    console.log('indexer initialised');
    this.isinitialised = true;
    this.debugLogger.log('## Debug Indexer End ###');
  }

  private async readPackageNames() {
    this.packageNames = {};
    this.tsConfigs = {};
    let seenPackageNames: { [key: string]: boolean } = {};

    const packageFiles = await vscode.workspace.findFiles(
      '**/package.json',
      '**/node_modules/**',
      1000
    );

    for (const packageFile of packageFiles) {
      const content = await fs.readFileAsync(packageFile.fsPath, 'utf-8');
      try {
        let json = JSON.parse(content);
        if (json.name) {
          if (seenPackageNames[json.name]) {
            delete this.packageNames[json.name];
            continue;
          }
          seenPackageNames[json.name] = true;
          this.packageNames[json.name] = path.dirname(packageFile.fsPath);
        }
      } catch (e) {
        console.warn('Load package files error: ', e);
        this.debugLogger.log(
          'Load package files error: ',
          JSON.stringify(e, Object.getOwnPropertyNames(e))
        );
      }
    }

    const configFiles = await vscode.workspace.findFiles(
      '**/tsconfig{.json,.build.json}',
      '**/node_modules/**',
      1000
    );

    this.debugLogger.log('tsConfig files found: ', JSON.stringify(configFiles));

    for (const configFile of configFiles) {
      const content = await fs.readFileAsync(configFile.fsPath, 'utf-8');

      try {
        const config = await this.parseExtendedTsConfigToJson(
          configFile.fsPath,
          content
        );

        if (config.config) {
          this.tsConfigs[configFile.fsPath] = config;
        }
      } catch (e: any) {
        console.warn('Load config files error: ', e);
        this.debugLogger.log(
          'Load config files error: ',
          JSON.stringify(e, Object.getOwnPropertyNames(e))
        );
      }
    }
  }

  startNewMoves() {
    this.fileEditLog = [];
  }

  endNewMoves() {
    const files = [...this.fileEditLog];
    this.fileEditLog = [];
    return files;
  }

  private async parseExtendedTsConfigToJson(
    filePath: string,
    content: string
  ): Promise<ConfigInfo> {
    let config: ConfigInfo = {
      config: ts.parseConfigFileTextToJson(filePath, content).config,
      configPath: filePath,
    };
    if (config.config.extends) {
      config = await this.extendedConfigInfo({
        config: config.config,
        configPath: filePath,
      });
    }
    return config;
  }

  private async extendedConfigInfo(
    extenderConfigInfo: ConfigInfo
  ): Promise<ConfigInfo> {
    const configDir = path.dirname(extenderConfigInfo.configPath);
    const baseConfigPath = path.join(
      configDir,
      extenderConfigInfo.config.extends as string
    );

    const baseContent = await fs.readFileAsync(baseConfigPath, 'utf-8');
    const baseConfigInfo: ConfigInfo = {
      config: ts.parseConfigFileTextToJson(baseConfigPath, baseContent).config,
      configPath: baseConfigPath,
    };

    const merged = this.mergeConfigs(extenderConfigInfo, baseConfigInfo);
    if (baseConfigInfo.config.extends) {
      merged.config.extends = baseConfigInfo.config.extends;
      this.debugLogger.log(
        'recurse next level of extension:',
        baseConfigInfo.config.extends
      );

      // recurse next level of extension
      return this.extendedConfigInfo(merged);
    } else {
      return merged;
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
          paths: baseConfigInfo.config?.compilerOptions?.paths,
          // TODO: work out what happens with two base urls and base's paths
          baseUrl: baseConfigInfo.config?.compilerOptions?.baseUrl,
        },
        extends: undefined,
      },
      configPath: baseConfigInfo.configPath,
    };
  }

  private readonly filesToScanGlob = '**/*.ts';

  private async scanAll(progress?: vscode.Progress<{ message: string }>) {
    this.index = new ReferenceIndex();
    const start = Date.now();

    const files = await vscode.workspace.findFiles(
      this.filesToScanGlob,
      '**/node_modules/**',
      100000
    );

    await this.processWorkspaceFiles(files, false, progress);

    console.log('scan finished in ' + (Date.now() - start) + 'ms');
    console.log(`Indexed ${this.index.fileCount()} files`);
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
    if (!conf('openEditors', false)) {
      return fs.readFileAsync(filePath, 'utf8').then((text) => {
        const edits = getEdits(filePath, text);
        if (edits.length === 0) {
          return Promise.resolve();
        }

        let newText = applyGenericEdits(text, edits);

        this.fileEditLog.push(filePath);

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
            this.fileEditLog.push(filePath);
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

      return <Replacement[]>references
        .map((reference) => {
          const absReference = this.resolveRelativeReference(
            from,
            reference.path
          );

          let newReference = this.getRelativePath(to, absReference);
          if (isPathToAnotherDir(newReference)) {
            // if path contains ../ then look for direct path or wildcard path
            const { resolved, isPath } = this.resolveToPath(to, newReference);
            if (isPath && reference.path === resolved) {
              return null;
            }
          }

          newReference = this.removeExtension(newReference);
          newReference = this.removeIndexSuffix(newReference);
          return [reference.path, newReference];
        })
        // filter unchanged paths
        .filter((replacement) => !!replacement);
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
        console.log('replacements', relative, newRelative);
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
      this.debugLogger.log(
        'updateImports error',
        JSON.stringify(e, Object.getOwnPropertyNames(e))
      );

      console.log(e);
    });
  }

  private addAffectedByBarrels(
    affectedFiles: Reference[],
    exportedNameToChange?: string
  ) {
    if (affectedFiles.length === 0) {
      return affectedFiles;
    }
    if (!exportedNameToChange) {
      return affectedFiles;
    }
    const barrels = affectedFiles.filter((ref) => ref.isExport);
    const affectedFromBarrel = flattenArray<Reference>(
      barrels.map((ref) =>
        this.getReferencesForSpecifier(ref.path, exportedNameToChange)
      )
    );
    affectedFiles = mergeReferenceArrays(affectedFiles, affectedFromBarrel);
    return affectedFiles;
  }

  private getReferencesForSpecifier(
    path: string,
    specifier: string
  ): Reference[] {
    const refsForSpecifier = this.index
      .getReferences(path)
      .filter(
        (barrelRef) =>
          barrelRef.specifiers.includes(specifier) || barrelRef.isExport
      );

    const nonExportRefs = refsForSpecifier.filter((ref) => !ref.isExport);

    const deepRefs = flattenArray<Reference>(
      refsForSpecifier
        .filter((ref) => ref.isExport)
        .map((ref) => this.getReferencesForSpecifier(ref.path, specifier))
    );

    return [...nonExportRefs, ...deepRefs];
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

  private getUnnamedExports(key: string) {
    return this.index.references[key].filter(
      (ref) => ref.isExport && ref.specifiers.length === 0
    );
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
    const generatePathWithoutTsConfig = () => {
      for (let packageName in this.packageNames) {
        const packagePath = this.packageNames[packageName];
        if (isInDir(packagePath, to) && !isInDir(packagePath, from)) {
          return asUnix(path.join(packageName, path.relative(packagePath, to)));
        }
      }
      let relative = path.relative(path.dirname(from), to);
      if (!relative.startsWith('.')) {
        relative = './' + relative;
      }
      return asUnix(relative);
    };

    if (conf('useLocalDirectPaths', false)) {
      const fromDir = path.dirname(from);
      if (to.startsWith(fromDir)) {
        return generatePathWithoutTsConfig();
      }
    }

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

    return generatePathWithoutTsConfig();
  }

  private resolveToPath(
    fsPath: string,
    localPath: string
  ): { resolved: string; isPath: boolean } {
    const resolvedFilePath = path.resolve(path.dirname(fsPath), localPath);
    const configInfo = this.getTsConfig(fsPath);
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
          // wildcard path mappings
          if (p.endsWith('*')) {
            const paths = config.compilerOptions.paths[p];
            for (let i = 0; i < paths.length; i++) {
              const mapped = paths[i].slice(0, -1);
              const mappedDir = path.resolve(baseUrl, mapped);
              if (isInDir(mappedDir, resolvedFilePath)) {
                return {
                  resolved:
                    p.slice(0, -1) + resolvedFilePath.replace(mappedDir, ''),
                  isPath: true,
                };
              }
            }
          } else {
            // fixed path mappings
            const paths = config.compilerOptions.paths[p];
            for (let i = 0; i < paths.length; i++) {
              const mapped = paths[i];
              const mappedDir = path.resolve(baseUrl, mapped);
              if (isInDir(mappedDir, resolvedFilePath)) {
                return {
                  resolved: p,
                  isPath: true,
                };
              }
            }
          }
        }
      }
    }

    return {
      resolved: localPath,
      isPath: false,
    };
  }

  private resolveRelativeReference(fsPath: string, reference: string): string {
    if (reference.startsWith('.')) {
      return path.resolve(path.dirname(fsPath), reference);
    } else {
      const configInfo = this.getTsConfig(fsPath);
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
      ];
      const tsConfigPath = tsConfigPaths.find((p) =>
        this.tsConfigs.hasOwnProperty(p)
      );

      if (tsConfigPath) {
        return this.tsConfigs[tsConfigPath];
      }
      prevDir = dir;
      dir = path.dirname(dir);
    }
    return null;
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

  /**
   * Get import / export paths from ts file.
   * @param fileName
   * @param data
   * @returns array of import / export paths as FoundItem[]
   */
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
          let specifiers: string[] = [];
          if (node.exportClause && ts.isNamedExports(node.exportClause)) {
            specifiers = node.exportClause?.elements.map(
              (elem) => elem.name.text
            );
          }
          result.push({
            itemType: 'exportPath',
            itemText: node.moduleSpecifier.text,
            specifiers,
            location: {
              start: node.moduleSpecifier.getStart(file),
              end: node.moduleSpecifier.getEnd(),
            },
          });
        }
      }

      // TODO: add import STATEMENT HANDLER HERE (for router modules)
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
        if (!referenced.endsWith(ext)) {
          if (fs.existsSync(referenced + ext)) {
            referenced += ext;
          } else if (fs.existsSync(referenced + '/index' + ext)) {
            referenced += '/index' + ext;
          }
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
