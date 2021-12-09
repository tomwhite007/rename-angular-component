import * as vscode from 'vscode';

export function getProjectRoot(uri: vscode.Uri) {
  return vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath;
}
