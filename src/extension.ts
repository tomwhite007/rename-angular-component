import * as vscode from 'vscode';

import { ReferenceIndexer } from './move-ts-indexer/reference-indexer';
import { UserMessage } from './rename-angular-component/logging/user-message.class';
import { EXTENSION_NAME } from './rename-angular-component/definitions/extension-name';
import { Renamer } from './rename-angular-component/renamer.class';
import { DebugLogger } from './rename-angular-component/logging/debug-logger.class';
import { getConfig } from './rename-angular-component/definitions/getConfig.function';

export function activate(context: vscode.ExtensionContext) {
  const debugLogger = new DebugLogger(getConfig('debugLog', false));
  const indexStart = Date.now();
  const userMessage = new UserMessage(EXTENSION_NAME);
  const indexer: ReferenceIndexer = new ReferenceIndexer(debugLogger);

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

  const initialise = async () => {
    if (indexer.isinitialised) {
      return Promise.resolve();
    }
    await initWithProgress();
    return (Date.now() - indexStart) / 1000;
  };

  const initialisePromise = initialise();
  const renamer = new Renamer(
    indexer,
    initialisePromise,
    userMessage,
    debugLogger
  );

  let renameComponent = vscode.commands.registerCommand(
    'rename-angular-component.renameComponent',
    async (uri: vscode.Uri) => renamer.rename('component', uri)
  );
  context.subscriptions.push(renameComponent);

  let renameDirective = vscode.commands.registerCommand(
    'rename-angular-component.renameDirective',
    (uri: vscode.Uri) => renamer.rename('directive', uri)
  );
  context.subscriptions.push(renameDirective);

  let renameService = vscode.commands.registerCommand(
    'rename-angular-component.renameService',
    (uri: vscode.Uri) => renamer.rename('service', uri)
  );
  context.subscriptions.push(renameService);
}

export function deactivate() {}
