// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { FileHandle } from 'fs/promises';
import * as vscode from 'vscode';
import { rename } from './helpers/rename.function';
import { ReferenceIndexer } from './indexer/referenceindexer';

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension activated');
  const importer: ReferenceIndexer = new ReferenceIndexer();

  function initWithProgress() {
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Window,
        title: 'Rename Angular Component is indexing',
      },
      async (progress) => {
        return importer.init(progress);
      }
    );
  }

  const initialize = () => {
    if (importer.isInitialized) {
      return Promise.resolve();
    }
    return initWithProgress();
  };

  /* TODO run initialize() and show Input Box at the same time - 
  then make sure / wait for importer.isInitialized without running 
  a second instance of initWithProgress */

  let renameComponent = vscode.commands.registerCommand(
    'rename-angular-component.renameComponent',
    (uri: vscode.Uri) =>
      initialize().then(() => rename('component', uri, importer))
  );
  context.subscriptions.push(renameComponent);

  let renameDirective = vscode.commands.registerCommand(
    'rename-angular-component.renameDirective',
    (uri: vscode.Uri) =>
      initialize().then(() => rename('directive', uri, importer))
  );
  context.subscriptions.push(renameDirective);

  let renameService = vscode.commands.registerCommand(
    'rename-angular-component.renameService',
    (uri: vscode.Uri) =>
      initialize().then(() => rename('service', uri, importer))
  );
  context.subscriptions.push(renameService);
}

export function deactivate() {}
