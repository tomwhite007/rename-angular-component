import * as vscode from 'vscode';
import { pascalCase } from 'pascal-case';
import { AngularConstruct } from '../definitions/file.interfaces';

export function logInfo(
  additionalInfoMessage: string,
  construct: AngularConstruct,
  output: vscode.OutputChannel,
  textLines?: string[]
) {
  const title = `Rename Angular ${pascalCase(construct)}`;
  vscode.window.showInformationMessage(`${title}${additionalInfoMessage}`);

  if (textLines) {
    const channel = output;
    channel.appendLine(``);
    channel.appendLine(`*** ${title} output: ***`);
    channel.appendLine(``);
    textLines.forEach((line) => channel.appendLine(line));
    channel.show();
  }
}
