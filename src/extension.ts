// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { FileHandle } from 'fs/promises';
import { FileInfoResult } from 'prettier';
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "rename-angular-component" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let renameComponent = vscode.commands.registerCommand(
    'rename-angular-component.renameComponent',
    (e) => {
      const filePath: string = e.path;
      const lastSlash = filePath.lastIndexOf('/');
      const path = filePath.substr(0, lastSlash);
      const file = filePath.substr(
        lastSlash + 1,
        filePath.length - lastSlash - 1
      );
      console.log(path, file);

      vscode.window.showInputBox({
        title: 'Rename file stub',
        prompt:
          'Type the new filename stub you want to rename to. Use kebab case.',
        value: file,
      });
      // Display a message box to the user
      vscode.window.showInformationMessage(
        'Hello World from Rename Angular Component!'
      );
    }
  );
  context.subscriptions.push(renameComponent);

  let renameDirective = vscode.commands.registerCommand(
    'rename-angular-component.renameDirective',
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage(
        'Hello World from Rename Angular Directive!'
      );
    }
  );
  context.subscriptions.push(renameDirective);

  let renameService = vscode.commands.registerCommand(
    'rename-angular-component.renameService',
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage(
        'Hello World from Rename Angular Service!'
      );
    }
  );
  context.subscriptions.push(renameService);
}

// this method is called when your extension is deactivated
export function deactivate() {}
