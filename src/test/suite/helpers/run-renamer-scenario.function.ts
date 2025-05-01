import path = require('path');
import * as vscode from 'vscode';
import { ReferenceIndexBuilder } from '../../../move-ts-indexer/reference-index-builder';
import { EXTENSION_NAME } from '../../../rename-angular-component/definitions/extension-name';
import { AngularConstruct } from '../../../rename-angular-component/definitions/file.interfaces';
import { FileMoveHandler } from '../../../rename-angular-component/file-manipulation/file-move-handler.class';
import { DebugLogger } from '../../../rename-angular-component/logging/debug-logger.class';
import { UserMessage } from '../../../rename-angular-component/logging/user-message.class';
import { Renamer } from '../../../rename-angular-component/renamer.class';
import { timeoutPause } from '../../../utils/timeout-pause';

export interface RenameCallConfig {
  filePath: string;
  construct: AngularConstruct;
  newStub: string;
}

export async function runRenamerScenario(
  projectRoot: string,
  renames: RenameCallConfig[]
) {
  const debugLogger = new DebugLogger(false);
  const userMessage = new UserMessage(EXTENSION_NAME);
  const indexer: ReferenceIndexBuilder = new ReferenceIndexBuilder(debugLogger);
  const fileMoveHandler = new FileMoveHandler(
    indexer,
    userMessage,
    debugLogger
  );

  const initWithProgress = () => {
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `${EXTENSION_NAME} is indexing`,
      },
      async (progress) => {
        return indexer.init(progress);
      }
    );
  };
  await initWithProgress();

  const renamer = new Renamer(
    Promise.resolve(),
    userMessage,
    debugLogger,
    fileMoveHandler
  );

  for (const rename of renames) {
    renamer.testBypass = { stub: rename.newStub };
    await renamer.rename(
      rename.construct,
      vscode.Uri.file(path.join(projectRoot, rename.filePath))
    );
    // allow indexer to finish re-indexing in the background
    await timeoutPause(1000);
  }
}
