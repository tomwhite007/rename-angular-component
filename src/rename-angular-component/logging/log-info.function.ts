import { OutputChannel } from 'vscode';

export function logInfo(output: OutputChannel, textLines?: string[]) {
  if (textLines) {
    textLines.forEach((line) => output.appendLine(line));
    output.show();
  }
}
