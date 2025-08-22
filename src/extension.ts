import vscode from 'vscode';

import { ReferenceIndexBuilder } from './move-ts-indexer/reference-index-builder';
import { conf } from './move-ts-indexer/util/helper-functions';
import { EXTENSION_NAME } from './rename-angular-component/definitions/extension-name';
import { FileMoveHandler } from './rename-angular-component/file-manipulation/file-move-handler.class';
import { isAngularProject } from './rename-angular-component/file-manipulation/is-angular-project.function';
import { DebugLogger } from './rename-angular-component/logging/debug-logger.class';
import { UserMessage } from './rename-angular-component/logging/user-message.class';
import { Renamer } from './rename-angular-component/renamer.class';
import { WhatsNewHandler } from './whats-new/whats-new-handler';

export function activate(context: vscode.ExtensionContext) {
  isAngularProject().then((isAngular) => {
    const debugLogger = new DebugLogger(conf('debugLog', false));
    debugLogger.logToConsole(
      `Rename Angular Component check: is Angular project? ${isAngular}`
    );

    // Set context key to enable / disable commands listed in package.json
    vscode.commands.executeCommand(
      'setContext',
      'renameAngularComponent.isAngularProject',
      isAngular
    );

    if (!isAngular) {
      return;
    }

    const whatsNewHandler = new WhatsNewHandler(context);
    whatsNewHandler.checkAndShowWhatsNew().catch((error) => {
      console.error("Error showing What's New screen:", error);
    });

    const indexStart = Date.now();
    const userMessage = new UserMessage(EXTENSION_NAME);
    const indexer: ReferenceIndexBuilder = new ReferenceIndexBuilder(
      debugLogger
    );
    const fileMoveHandler = new FileMoveHandler(indexer, userMessage);

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
      initialisePromise,
      userMessage,
      debugLogger,
      fileMoveHandler
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        'rename-angular-component.renameComponent',
        async (uri: vscode.Uri) => renamer.rename('component', uri)
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

    context.subscriptions.push(
      vscode.commands.registerCommand(
        'rename-angular-component.renameFile',
        (uri: vscode.Uri) => renamer.rename('file', uri)
      )
    );

    // Register What's New commands
    context.subscriptions.push(
      vscode.commands.registerCommand(
        'rename-angular-component.showWhatsNew',
        () => whatsNewHandler.showWhatsNewManually()
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        'rename-angular-component.resetWhatsNew',
        () => whatsNewHandler.resetStoredVersion()
      )
    );
  });
}

export function deactivate() {}
