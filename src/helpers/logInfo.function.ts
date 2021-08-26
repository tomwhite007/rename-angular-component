import { AngularConstruct } from './definitions/file.interfaces';
import * as vscode from 'vscode';
import { pascalCase } from 'pascal-case';

export function logInfo(
  additionalInfoMessage: string,
  construct: AngularConstruct,
  textLines?: string[]
) {
  const title = `Rename Angular ${pascalCase(construct)}`;
  vscode.window.showInformationMessage(`${title}${additionalInfoMessage}`);

  if (textLines) {
    const channel = vscode.window.createOutputChannel(title);
    channel.appendLine(``);
    channel.appendLine(`*** ${title} output: ***`);
    channel.appendLine(``);
    textLines.forEach((line) => channel.appendLine(line));
    channel.show();
  }
}
