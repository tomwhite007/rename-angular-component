import { window } from 'vscode';

export function popupMessage(text: string) {
  window.showInformationMessage(text);
}
