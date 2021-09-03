import * as vscode from 'vscode';

export function getProjectRoot() {
  return vscode.workspace.getWorkspaceFolder(
    vscode.window.activeTextEditor?.document.uri as vscode.Uri
  )?.uri.fsPath;
}
