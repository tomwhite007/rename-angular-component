// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { FileHandle } from 'fs/promises';
import * as vscode from 'vscode';
import { rename } from './helpers/rename.function';
import { ReferenceIndexer } from './indexer/referenceindexer';

export function activate(context: vscode.ExtensionContext) {
  const indexStart = Date.now();
  const importer: ReferenceIndexer = new ReferenceIndexer();

  const initWithProgress = () => {
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Rename Angular Component is indexing',
      },
      async (progress) => {
        return importer.init(progress);
      }
    );
  };

  const initialise = async () => {
    if (importer.isinitialised) {
      return Promise.resolve();
    }
    await initWithProgress();
    return (Date.now() - indexStart) / 1000;
  };

  const initialisePromise = initialise();

  let renameComponent = vscode.commands.registerCommand(
    'rename-angular-component.renameComponent',
    async (uri: vscode.Uri) =>
      // TODO: remove when no direct test process is needed
      // {
      //   const filePath =
      //     '/Users/tom/Development/dng/dgx-sales-spa-dev2/libs/sales/feature-appliance-details/src/lib/appliance-details/appliance-details.component.spec.ts';

      //   const testText = await fs.readFileAsync(filePath, 'utf8');

      //   getClassNameEdits(filePath, testText);
      // }
      rename('component', uri, importer, initialisePromise)
  );
  context.subscriptions.push(renameComponent);

  let renameDirective = vscode.commands.registerCommand(
    'rename-angular-component.renameDirective',
    (uri: vscode.Uri) => rename('directive', uri, importer, initialisePromise)
  );
  context.subscriptions.push(renameDirective);

  let renameService = vscode.commands.registerCommand(
    'rename-angular-component.renameService',
    (uri: vscode.Uri) => rename('service', uri, importer, initialisePromise)
  );
  context.subscriptions.push(renameService);
}

export function deactivate() {}
