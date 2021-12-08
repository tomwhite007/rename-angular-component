import * as vscode from 'vscode';
import { pascalCase } from 'pascal-case';
import {
  AngularConstruct,
  OriginalFileDetails,
} from './definitions/file.interfaces';
import { getProjectRoot } from './definitions/getProjectRootFilePath.function';
import { ReferenceIndexer } from '../indexer/referenceindexer';
import { FileItem } from '../indexer/fileitem';
import * as fs from 'fs-extra-promise';
import { paramCase } from 'change-case';
import { getOriginalFileDetails } from './fileManipulation/getOriginalFileDetails.function';
import {
  getClassNameEdits,
  getCoreClassEdits,
  SelectorTransfer,
} from '../indexer/ts-file-helpers';
import { windowsFilePathFix } from './fileManipulation/windows-file-path-fix.function';
import { FilesRelatedToStub } from './filesRelatedtToStub.class';
import { findReplaceSelectorsInTemplateFiles } from './fileManipulation/findReplaceSelectorsInTemplateFiles.function';

export async function rename(
  construct: AngularConstruct,
  uri: vscode.Uri,
  importer: ReferenceIndexer,
  indexerInitialisePromise: Thenable<any>
) {
  const start = Date.now();
  const originalFileDetails: Readonly<OriginalFileDetails> =
    getOriginalFileDetails(uri.path);
  const projectRoot = windowsFilePathFix(getProjectRoot(uri) as string);
  const title = `Rename Angular ${pascalCase(construct)}`;

  const inputResult = await vscode.window.showInputBox({
    title,
    prompt: `Enter the new ${construct} name.`,
    value: originalFileDetails.stub,
  });

  if (!inputResult || originalFileDetails.stub === inputResult) {
    // TODO: add pop up - nothing changed

    return;
  }
  // make sure it's kebab
  const newStub = paramCase(inputResult ?? '');

  const timeoutPause = async (wait = 0) => {
    await new Promise((res) => setTimeout(res, wait));
    return;
  };

  // wait for indexer initialise to complete
  await indexerInitialisePromise;
  const output = importer.setOutputChannel(
    `Rename Angular ${pascalCase(construct)}`
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
            importsEdits: (() =>
              getClassNameEdits(oldClassName, newClassName))(),
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

        const progressIncrement = Math.floor(80 / fileMoveJobs.length);
        let currentProgress = 20;
        importer.startNewMoves(fileMoveJobs);
        for (const item of fileMoveJobs) {
          currentProgress += progressIncrement;
          progress.report({ increment: currentProgress });
          await timeoutPause(10);
          await item.move(importer);
        }

        if (selectorTransfer.oldSelector && selectorTransfer.newSelector) {
          await findReplaceSelectorsInTemplateFiles(
            construct,
            selectorTransfer.oldSelector,
            selectorTransfer.newSelector
          );
        } else {
          throw new Error('selectorTransfer not set');
        }

        /* TODO - big steps left...    

        fix popup messages

        fix logging

        check for other to dos

        fix up all selectors

        make sure services and directives work - or disable features

        make sure I don't need to leave a compliment to MoveTS

        check what happens with open editors

        ---- v2 -----

        handle open editors
          looks like reference indexer, replaceReferences() already can - need same for core class file
            close affected open tabs except if unsaved - then warn and stop?

        fix up / remove tsmove conf() configuration

        make sure input newStub matches constraints and formatting allowed by CLI

        refactor for clean classes, functions and pure async await

        ---- v3 -----
        */

        // delete original folder
        fs.remove(originalFileDetails.path);

        progress.report({ increment: 100 });
        console.log('all done: ', Date.now() - start + `ms.`);
        await timeoutPause(50);
      } catch (e) {
        console.log('error in extension.ts', e);
      }
    }
  );
}
