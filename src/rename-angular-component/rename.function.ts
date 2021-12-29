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

export async function rename(
  construct: AngularConstruct,
  uri: vscode.Uri,
  importer: ReferenceIndexer,
  indexerInitialisePromise: Thenable<any>,
  userMessage: UserMessage
) {
  const title = `Rename Angular ${pascalCase(construct)}`;

  // Handle if called from command menu
  if (!uri) {
    const userEntered = await noSelectedFileHandler(
      construct,
      title,
      userMessage
    );
    if (userEntered) {
      uri = userEntered;
    } else {
      return;
    }
  }

  const originalFileDetails: Readonly<OriginalFileDetails> =
    getOriginalFileDetails(uri.path);
  const projectRoot = windowsFilePathFix(getProjectRoot(uri) as string);
  const haveSelectors: Readonly<AngularConstruct[]> = [
    'component',
    'directive',
  ];

  if (checkForOpenUnsavedEditors()) {
    userMessage.popupMessage(`Please save any edits before using ${title}`);
    return;
  }

  const inputResult = await vscode.window.showInputBox({
    title,
    prompt: `Enter the new ${construct} name.`,
    value: originalFileDetails.stub,
  });
  const start = Date.now();

  if (!inputResult) {
    userMessage.popupMessage(`New ${construct} name not entered. Stopped.`);
    return;
  }
  if (originalFileDetails.stub === inputResult) {
    userMessage.popupMessage(
      `${pascalCase(construct)} name same as original. Stopped.`
    );
    return;
  }
  if (!inputResult.match(/^[a-z0-9-_]*$/i)) {
    userMessage.popupMessage(
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

  userMessage.setOperationTitle(title);

  // wait for indexer initialise to complete
  const indexTime = await indexerInitialisePromise;
  userMessage.logInfoToChannel(
    [
      `Index files completed in ${Math.round(indexTime * 100) / 100} seconds`,
      '',
    ],
    false
  );

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: title + ' in progress',
      cancellable: false,
    },
    async (progress) => {
      progress.report({ increment: 0 });
      await timeoutPause();

      try {
        const filesRelatedToStub = await FilesRelatedToStub.init(
          originalFileDetails,
          projectRoot,
          construct
        );
        const renameFolder = filesRelatedToStub.folderNameSameAsStub;

        const filesToMove = filesRelatedToStub.getFilesToMove(
          newStub as string
        );
        if (!filesToMove.find((f) => f.isCoreConstruct)) {
          userMessage.popupMessage(
            `The ${construct} class file must use the same file naming convention as '${originalFileDetails.file}' for this process to run.`
          );
          return;
        }

        const coreFilePath = filesToMove.find(
          (f) => f.isCoreConstruct
        )?.filePath;
        const oldClassName = await getOriginalClassName(
          originalFileDetails.stub,
          coreFilePath as string,
          construct
        );
        const newClassName = `${pascalCase(newStub)}${pascalCase(construct)}`;

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
                    construct,
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
        importer.startNewMoves(fileMoveJobs);
        for (const item of fileMoveJobs) {
          currentProgress += progressIncrement;
          progress.report({ increment: currentProgress });
          await timeoutPause(10);
          await item.move(importer);
        }

        // update selectors for components and directives
        if (haveSelectors.includes(construct)) {
          if (selectorTransfer.oldSelector && selectorTransfer.newSelector) {
            await findReplaceSelectorsInTemplateFiles(
              selectorTransfer.oldSelector,
              selectorTransfer.newSelector,
              userMessage
            );
          } else {
            throw new Error('selectorTransfer not set');
          }
        }

        /* TODO - big steps left...

        Prep for publish:

          update main readme...
            add issues and link to them

          make repo public & submit extension

          update changelog



        ---- v2 -----

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
        userMessage.logInfoToChannel([
          '',
          `${title} completed in ${renameTime} seconds`,
        ]);
        await timeoutPause(50);
      } catch (e) {
        console.log('error in extension.ts', e);
        userMessage.logInfoToChannel([
          `Sorry, an error occurred during the ${title} process`,
          `I recommend reverting the changes made if there are any`,
          `If it looks like a new issue, I'd welcome you raising it here: [${EXTENSION_NAME} Issues](https://github.com/tomwhite007/rename-angular-component/issues)`,
          `If it looks like an existing issue, I'd appreciate it if you'd +1 it on Github to chivvy me along`,
        ]);
      }
    }
  );
}
