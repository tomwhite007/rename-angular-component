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

export async function rename(
  construct: AngularConstruct,
  uri: vscode.Uri,
  importer: ReferenceIndexer,
  indexerInitialisePromise: Thenable<any>,
  userMessage: UserMessage
) {
  const originalFileDetails: Readonly<OriginalFileDetails> =
    getOriginalFileDetails(uri.path);
  const projectRoot = windowsFilePathFix(getProjectRoot(uri) as string);
  const title = `Rename Angular ${pascalCase(construct)}`;
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

  userMessage.setOperationTitle(title);
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
        const oldClassName = `${pascalCase(
          originalFileDetails.stub
        )}${pascalCase(construct)}`;
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

        fix rename service in same name and different name folder
        fix rename component in different folder
        check rename directive in same name and different name folder


        use same output channel if exists


        spec  - maybe replace selector references in them too



        Prep for publish:

        update main readme

        add icon / images / animation

        update changelog

        add additional stuff in package json - keywords etc

        ---- v2 -----

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
      }
    }
  );
}
