import { OutputChannel, window } from 'vscode';

export class UserMessage {
  outputChannel: OutputChannel;

  constructor(name: string) {
    this.outputChannel = window.createOutputChannel(name);
  }

  setOperationTitle(title: string) {
    const line = new Array(title.length + 1).join('-');
    this.outputChannel.clear();
    this.outputChannel.appendLine(line);
    this.outputChannel.appendLine(title);
    this.outputChannel.appendLine(line);
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
