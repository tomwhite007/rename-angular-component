// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { FileHandle } from 'fs/promises';
import * as vscode from 'vscode';
import { rename } from './helpers/rename.function';
import { ReferenceIndexer } from './indexer/referenceindexer';
import { AngularConstruct } from './helpers/definitions/file.interfaces';

export function activate(context: vscode.ExtensionContext) {
  const importer: ReferenceIndexer = new ReferenceIndexer();

  const initWithProgress = () => {
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Window,
        title: 'Rename Angular Component is indexing',
      },
      async (progress) => {
        return importer.init(progress);
      }
    );
  };

  const initialise = () => {
    if (importer.isinitialised) {
      return Promise.resolve();
    }
    return initWithProgress();
  };

  const initialisePromise = initialise();

  let renameComponent = vscode.commands.registerCommand(
    'rename-angular-component.renameComponent',
    async (uri: vscode.Uri) =>
      // TODO: remove when no direct test process is needed
      // {
      //   const filePath =
      //     '/Users/tom/Development/dng/dgx-sales-spa-dev2/libs/sales/feature-appliance-details/src/lib/appliance-details/appliance-details.component.ts';

      //   const testText = await fs.readFileAsync(filePath, 'utf8');

      //   applyClassNameEdits(
      //     filePath,
      //     testText,
      //     'ApplianceDetailsComponent',
      //     'TestClass'
      //   );
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
