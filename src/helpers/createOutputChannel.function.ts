import { window } from 'vscode';

export function createOutputChannel(name: string) {
  const output = window.createOutputChannel(name);
  const line = new Array(name.length + 1).join('-');
  output.clear();
  output.appendLine(line);
  output.appendLine(name);
  output.appendLine(line);
  return output;
}
