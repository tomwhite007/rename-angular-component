import path = require('path');
import * as vscode from 'vscode';
import { ReferenceIndexBuilder } from '../../../move-ts-indexer/reference-index-builder';
import { EXTENSION_NAME } from '../../../rename-angular-component/definitions/extension-name';
import { DebugLogger } from '../../../rename-angular-component/logging/debug-logger.class';
import { UserMessage } from '../../../rename-angular-component/logging/user-message.class';
import { Renamer } from '../../../rename-angular-component/renamer.class';

export async function runRenamerScenario(
  projectRoot: string,
  filePath: string,
  newStub: string
) {
  const debugLogger = new DebugLogger(false);
  const userMessage = new UserMessage(EXTENSION_NAME);
  const indexer: ReferenceIndexBuilder = new ReferenceIndexBuilder(debugLogger);

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
    indexer,
    Promise.resolve(),
    userMessage,
    debugLogger
  );
  renamer.testBypass = { stub: newStub };

  await renamer.rename(
    'component',
    vscode.Uri.file(path.join(projectRoot, filePath))
  );
}
