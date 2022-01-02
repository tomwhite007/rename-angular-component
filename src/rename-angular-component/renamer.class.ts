import * as vscode from 'vscode';
import { pascalCase } from 'pascal-case';
import {
  AngularConstruct,
  OriginalFileDetails,
} from './definitions/file.interfaces';
import { getProjectRoot } from './definitions/get-project-root-file-path.function';
import { ReferenceIndexer } from '../move-ts-indexer/reference-indexer';
import { FileItem } from '../move-ts-indexer/file-item';
import * as fs from 'fs-extra-promise';
import { paramCase } from 'change-case';
import { getOriginalFileDetails } from './in-file-edits/get-original-file-details.function';
import { windowsFilePathFix } from './file-manipulation/windows-file-path-fix.function';
import { FilesRelatedToStub } from './file-manipulation/files-related-to-stub.class';
import { findReplaceSelectorsInTemplateFiles } from './file-manipulation/find-replace-selectors-in-template-files.function';
import {
  getClassNameEdits,
  getCoreClassEdits,
  SelectorTransfer,
} from './in-file-edits/custom-edits';
import { checkForOpenUnsavedEditors } from './window/check-for-open-unsaved-editors.funtion';
import * as path from 'path';
import { UserMessage } from './logging/user-message.class';
import { EXTENSION_NAME } from './definitions/extension-name';
import { noSelectedFileHandler } from './no-selected-file-handler/no-selected-file-handler.function';
import { getOriginalClassName } from './in-file-edits/get-original-class-name.function';

export class Renamer {
  private construct!: AngularConstruct;
  private uri!: vscode.Uri;
  private title!: string;

  constructor(
    private importer: ReferenceIndexer,
    private indexerInitialisePromise: Thenable<any>,
    private userMessage: UserMessage
  ) {}

  async rename(_construct: AngularConstruct, _uri: vscode.Uri) {
    this.construct = _construct;
    this.uri = _uri;
    this.title = `Rename Angular ${pascalCase(this.construct)}`;

    // Handle if called from command menu
    if (!this.uri) {
      const userEntered = await noSelectedFileHandler(
        this.construct,
        this.title,
        this.userMessage
      );
      if (userEntered) {
        this.uri = userEntered;
      } else {
        return;
      }
    }

    const originalFileDetails: Readonly<OriginalFileDetails> =
      getOriginalFileDetails(this.uri.path);
    const projectRoot = windowsFilePathFix(getProjectRoot(this.uri) as string);
    const haveSelectors: Readonly<AngularConstruct[]> = [
      'component',
      'directive',
    ];

    if (checkForOpenUnsavedEditors()) {
      this.userMessage.popupMessage(
        `Please save any edits before using ${this.title}`
      );
      return;
    }

    const inputResult = await vscode.window.showInputBox({
      title: this.title,
      prompt: `Enter the new ${this.construct} name.`,
      value: originalFileDetails.stub,
    });
    const start = Date.now();

    if (!inputResult) {
      this.userMessage.popupMessage(
        `New ${this.construct} name not entered. Stopped.`
      );
      return;
    }
    if (originalFileDetails.stub === inputResult) {
      this.userMessage.popupMessage(
        `${pascalCase(this.construct)} name same as original. Stopped.`
      );
      return;
    }
    if (!inputResult.match(/^[a-z0-9-_]*$/i)) {
      this.userMessage.popupMessage(
        `Currently only supports letters, numbers, dashes and underscore in the new name. (To be improved in next release)`
      );
      return;
    }
    // make sure it's kebab
    const newStub = paramCase(inputResult ?? '');

    const timeoutPause = async (wait = 0) => {
      await new Promise((res) => setTimeout(res, wait));
      return;
    };

    this.userMessage.setOperationTitle(this.title);

    // wait for indexer initialise to complete
    const indexTime = await this.indexerInitialisePromise;
    this.userMessage.logInfoToChannel(
      [
        `Index files completed in ${Math.round(indexTime * 100) / 100} seconds`,
        '',
      ],
      false
    );

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: this.title + ' in progress',
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 0 });
        await timeoutPause();

        try {
          const filesRelatedToStub = await FilesRelatedToStub.init(
            originalFileDetails,
            projectRoot,
            this.construct
          );
          const renameFolder = filesRelatedToStub.folderNameSameAsStub;

          const filesToMove = filesRelatedToStub.getFilesToMove(
            newStub as string
          );
          if (!filesToMove.find((f) => f.isCoreConstruct)) {
            this.userMessage.popupMessage(
              `The ${this.construct} class file must use the same file naming convention as '${originalFileDetails.file}' for this process to run.`
            );
            return;
          }

          const coreFilePath = filesToMove.find(
            (f) => f.isCoreConstruct
          )?.filePath;
          const oldClassName = await getOriginalClassName(
            originalFileDetails.stub,
            coreFilePath as string,
            this.construct
          );
          const newClassName = `${pascalCase(newStub)}${pascalCase(
            this.construct
          )}`;

          const selectorTransfer = new SelectorTransfer();

          const fileMoveJobs = filesToMove.map((f) => {
            const additionalEdits = {
              importsEdits:
                path.extname(f.filePath) === '.ts'
                  ? (() => getClassNameEdits(oldClassName, newClassName))()
                  : undefined,
              movedFileEdits: f.isCoreConstruct
                ? (() =>
                    getCoreClassEdits(
                      oldClassName,
                      newClassName,
                      originalFileDetails.stub,
                      newStub,
                      this.construct,
                      selectorTransfer
                    ))()
                : undefined,
            };

            return new FileItem(
              windowsFilePathFix(f.filePath, true),
              windowsFilePathFix(f.newFilePath, true),
              fs.statSync(f.filePath).isDirectory(),
              oldClassName,
              newClassName,
              additionalEdits
            );
          });

          if (fileMoveJobs.some((l) => l.exists())) {
            vscode.window.showErrorMessage(
              'Not allowed to overwrite existing files'
            );
            return;
          }

          progress.report({ increment: 20 });
          await timeoutPause();

          const progressIncrement = Math.floor(70 / fileMoveJobs.length);
          let currentProgress = 20;
          this.importer.startNewMoves(fileMoveJobs);
          for (const item of fileMoveJobs) {
            currentProgress += progressIncrement;
            progress.report({ increment: currentProgress });
            await timeoutPause(10);
            await item.move(this.importer);
          }

          // update selectors for components and directives
          if (haveSelectors.includes(this.construct)) {
            if (selectorTransfer.oldSelector && selectorTransfer.newSelector) {
              await findReplaceSelectorsInTemplateFiles(
                selectorTransfer.oldSelector,
                selectorTransfer.newSelector,
                this.userMessage
              );
            } else {
              throw new Error(
                "Selector edit not found. Couldn't amend selector."
              );
            }
          }

          /* TODO - big steps left...

        Prep for publish:

          update main readme...
            add issues and link to them

          make repo public & submit extension

          update changelog



        ---- v2 -----

        fix numbers in string to camel case; remove underscore?

        refactor into classes

        replace selector references in (make config option):
          spec
          story and stories files


        handle open editors
          looks like reference indexer, replaceReferences() already can - need same for core class file
            apply edits in dirty editor?

        fix up / remove tsmove conf() configuration

        make sure input newStub matches constraints and formatting allowed by CLI

        refactor for clean classes, functions and pure async await

        ---- v3 -----
        */

          // delete original folder
          if (renameFolder) {
            fs.remove(originalFileDetails.path);
          }

          progress.report({ increment: 100 });
          const renameTime = Math.round((Date.now() - start) / 10) / 100;
          this.userMessage.logInfoToChannel([
            '',
            `${this.title} completed in ${renameTime} seconds`,
          ]);
          await timeoutPause(50);
        } catch (e: any) {
          const raiseIssueMsgs = [
            `If it looks like a new issue, I'd welcome you raising it here: [${EXTENSION_NAME} Issues](https://github.com/tomwhite007/rename-angular-component/issues)`,
            `If it looks like an existing issue, I'd appreciate it if you'd +1 it on Github to chivvy me along`,
          ];

          const msg: string = e.message;
          if (msg.startsWith('Class Name') || msg.startsWith('Selector')) {
            this.userMessage.logInfoToChannel(['', msg, ...raiseIssueMsgs]);
            return;
          }

          console.log('error in extension.ts', e);
          this.userMessage.logInfoToChannel([
            `Sorry, an error occurred during the ${this.title} process`,
            `I recommend reverting the changes made if there are any`,
            ...raiseIssueMsgs,
          ]);
        }
      }
    );
  }
}
