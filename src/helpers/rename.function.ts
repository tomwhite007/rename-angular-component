import * as vscode from 'vscode';
import { pascalCase } from 'pascal-case';
import {
  AngularConstruct,
  OriginalFileDetails,
} from './definitions/file.interfaces';
import { renameToNewStub } from './renameToNewStub.function';
import { originalFileDetails } from './fileManipulation/originalFileDetails.function';
import { getProjectRoot } from './definitions/getProjectRootFilePath.function';
import { ReferenceIndexer } from '../indexer/referenceindexer';
import { likeFilesRegexPartialLookup } from './definitions/file-regex.constants';
import { FileItem } from '../indexer/fileitem';
import * as fs from 'fs';
import escapeStringRegexp from 'escape-string-regexp';

export function rename(
  construct: AngularConstruct,
  uri: vscode.Uri,
  importer: ReferenceIndexer
) {
  const fileDetails = originalFileDetails(uri.path);
  const projectRoot = getProjectRoot(uri) as string;
  const title = `Rename Angular ${pascalCase(construct)}`;

  vscode.window
    .showInputBox({
      title,
      prompt: `Enter the new ${construct} name.`,
      value: fileDetails.stub,
    })
    .then((newStub) => {
      if (!newStub) {
        return;
      }

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: title + ' in progress',
          cancellable: false,
        },
        async (progress) => {
          progress.report({ increment: 0 });

          const p = new Promise<void>(async (resolve) => {
            // renameToNewStub(construct, newStub, fileDetails, projectRoot);

            const filesRelatedToStub = await FilesRelatedToStub.init(
              fileDetails,
              projectRoot,
              construct
            );

            const filesToMove = filesRelatedToStub.getFilesToMove(newStub);

            const newLocations = filesToMove.map((f) => {
              return new FileItem(
                f.filePath,
                f.newFilePath,
                fs.statSync(f.filePath).isDirectory()
              );
            });

            newLocations.map((l) => {
              if (l.exists()) {
                console.log('exists!', l);
              }
            });

            if (newLocations.some((l) => l.exists())) {
              vscode.window.showErrorMessage(
                'Not allowed to overwrite existing files'
              );
              return;
            }

            importer.startNewMoves(newLocations);
            const move = FileItem.moveMultiple(newLocations, importer);
            move.catch((e) => {
              console.log('error in extension.ts', e);
            });

            /* TODO - big steps left...
              if the folder matches the stub, rename it

              find all the files in the folder
              rename all the ones with the same stub - decide if to only do the 4 or all
              if they're .ts, rename the classes too

              fix up all imports
              fix up all selectors
              */

            progress.report({ increment: 100 });

            setTimeout(async () => {
              move.then(() => resolve());
            }, 0);
          });

          return p;
        }
      );
    });
}

class FilesRelatedToStub {
  originalFileDetails!: OriginalFileDetails;
  folderNameSameAsStub = false;
  fileDetails: {
    filePath: string;
    sameConstruct: boolean;
    sameStub: boolean;
  }[] = [];
  constructFilesRegex!: RegExp;
  relatedFilesRegex!: RegExp;

  static async init(
    fileDetails: OriginalFileDetails,
    projectRoot: string,
    construct: AngularConstruct
  ) {
    const instance = new FilesRelatedToStub();
    await instance.catalogueFilesInCurrentFolder(
      fileDetails,
      projectRoot,
      construct
    );
    return instance;
  }

  private async catalogueFilesInCurrentFolder(
    fileDetails: OriginalFileDetails,
    projectRoot: string,
    construct: AngularConstruct
  ) {
    this.originalFileDetails = fileDetails;

    if (fileDetails.path.endsWith(fileDetails.stub)) {
      this.folderNameSameAsStub = true;
    }

    const glob = `${fileDetails.path.replace(projectRoot + '/', '')}/**/*`;
    const uris = await vscode.workspace.findFiles(
      glob,
      '**/node_modules/**',
      100000
    );

    this.constructFilesRegex = RegExp(
      `${escapeStringRegexp(fileDetails.stub)}${
        likeFilesRegexPartialLookup[construct]
      }`
    );
    this.relatedFilesRegex = new RegExp(
      `${escapeStringRegexp(fileDetails.stub)}${
        likeFilesRegexPartialLookup.any
      }`
    );

    uris.forEach((uri) => {
      this.fileDetails.push({
        filePath: uri.fsPath,
        sameConstruct: !!uri.fsPath.match(this.constructFilesRegex),
        sameStub: !!uri.fsPath.match(this.relatedFilesRegex),
      });
    });
  }

  getFilesToMove(newStub: string) {
    const folderReplaceRegex = new RegExp(
      `(?<=\/)${escapeStringRegexp(this.originalFileDetails.stub)}$`
    );
    const replaceStub = (filePath: string) => {
      if (this.folderNameSameAsStub) {
        filePath = filePath.replace(
          this.originalFileDetails.path,
          this.originalFileDetails.path.replace(folderReplaceRegex, newStub)
        );
      }
      return filePath.replace(this.constructFilesRegex, newStub);
    };

    return this.fileDetails
      .filter((fd) => this.folderNameSameAsStub || fd.sameConstruct)
      .map((fd) => ({
        filePath: fd.filePath,
        newFilePath: replaceStub(fd.filePath),
      }));
  }
}
