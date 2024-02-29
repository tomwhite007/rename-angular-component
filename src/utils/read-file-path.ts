import * as vscode from 'vscode';

export async function readFilePath(): Promise<string> {
  const originalClipboard = await vscode.env.clipboard.readText();
  await vscode.commands.executeCommand('copyFilePath');
  const newUri = await vscode.env.clipboard.readText();
  await vscode.env.clipboard.writeText(originalClipboard);
  return newUri;
}
