// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { FileHandle } from 'fs/promises';
import * as vscode from 'vscode';
import { rename } from './rename-angular-component/rename.function';
import { ReferenceIndexer } from './move-ts-indexer/reference-indexer';
import { UserMessage } from './rename-angular-component/logging/user-message.class';

const EXTENSION_NAME = 'Rename Angular Component';

export function activate(context: vscode.ExtensionContext) {
  const indexStart = Date.now();
  const userMessage = new UserMessage(EXTENSION_NAME);
  const indexer: ReferenceIndexer = new ReferenceIndexer(
    userMessage.outputChannel
  );

  const initWithProgress = () => {
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: '${EXTENSION_NAME} is indexing',
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

  let renameComponent = vscode.commands.registerCommand(
    'rename-angular-component.renameComponent',
    async (uri: vscode.Uri) =>
      // TODO: remove when no direct debug process is needed
      // {
      //   const filePath =
      //     '/Users/tom/Development/dng/dgx-sales-spa-dev2/libs/sales/feature-appliance-details/src/lib/appliance-details/appliance-details.component.spec.ts';

      //   const testText = await fs.readFileAsync(filePath, 'utf8');

      //   getClassNameEdits(filePath, testText);
      // }
      rename('component', uri, indexer, initialisePromise, userMessage)
  );
  context.subscriptions.push(renameComponent);

  let renameDirective = vscode.commands.registerCommand(
    'rename-angular-component.renameDirective',
    (uri: vscode.Uri) =>
      rename('directive', uri, indexer, initialisePromise, userMessage)
  );
  context.subscriptions.push(renameDirective);

  let renameService = vscode.commands.registerCommand(
    'rename-angular-component.renameService',
    (uri: vscode.Uri) =>
      rename('service', uri, indexer, initialisePromise, userMessage)
  );
  context.subscriptions.push(renameService);
}

export function deactivate() {}
