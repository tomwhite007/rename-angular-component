import { OutputChannel, window } from 'vscode';

export class UserMessage {
  outputChannel: OutputChannel;

  constructor(name: string) {
    this.outputChannel = window.createOutputChannel(name);
  }

  setOperationTitle(title: string) {
    const output = window.createOutputChannel(title);
    const line = new Array(title.length + 1).join('-');
    output.clear();
    output.appendLine(line);
    output.appendLine(title);
    output.appendLine(line);
    return output;
  }

  logInfoToChannel(textLines?: string[], setFocus = true) {
    if (textLines) {
      textLines.forEach((line) => this.outputChannel.appendLine(line));
      if (setFocus) {
        this.outputChannel.show();
      }
    }
  }

  popupMessage(text: string) {
    window.showInformationMessage(text);
  }
}
