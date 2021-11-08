// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { FileHandle } from "fs/promises";
import { FileInfoResult } from "prettier";
import * as vscode from "vscode";
import { rename } from "./helpers/rename.function";

export function activate(context: vscode.ExtensionContext) {
  let renameComponent = vscode.commands.registerCommand(
    "rename-angular-component.renameComponent",
    (uri: vscode.Uri) => rename("component", uri)
  );
  context.subscriptions.push(renameComponent);

  let renameDirective = vscode.commands.registerCommand(
    "rename-angular-component.renameDirective",
    (uri: vscode.Uri) => rename("directive", uri)
  );
  context.subscriptions.push(renameDirective);

  let renameService = vscode.commands.registerCommand(
    "rename-angular-component.renameService",
    (uri: vscode.Uri) => rename("service", uri)
  );
  context.subscriptions.push(renameService);
}

export function deactivate() {}
