import * as vscode from 'vscode';

import { ReferenceIndexBuilder } from './move-ts-indexer/reference-index-builder';
import { EXTENSION_NAME } from './rename-angular-component/definitions/extension-name';
import { getConfig } from './rename-angular-component/definitions/getConfig.function';
import { DebugLogger } from './rename-angular-component/logging/debug-logger.class';
import { UserMessage } from './rename-angular-component/logging/user-message.class';
import { Renamer } from './rename-angular-component/renamer.class';
import { IsValid } from './utils/is-valid-uri';
import { readFilePath } from './utils/read-file-path';

export function activate(context: vscode.ExtensionContext) {
  const debugLogger = new DebugLogger(getConfig('debugLog', false));
  const indexStart = Date.now();
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

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'rename-angular-component.renameComponent',
      async (uri: vscode.Uri) => {
        if (uri) {
          return renamer.rename('component', uri);
        }

        const newUri = await readFilePath();

        if (IsValid.componentUri(newUri)) {
          return renamer.rename('component', vscode.Uri.file(newUri));
        }

        vscode.window.showInformationMessage(
          'The selected file is not a component'
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'rename-angular-component.renameDirective',
      (uri: vscode.Uri) => renamer.rename('directive', uri)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'rename-angular-component.renameService',
      (uri: vscode.Uri) => renamer.rename('service', uri)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'rename-angular-component.renameGuard',
      (uri: vscode.Uri) => renamer.rename('guard', uri)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'rename-angular-component.renameModule',
      (uri: vscode.Uri) => renamer.rename('module', uri)
    )
  );
}

export function deactivate() {}
