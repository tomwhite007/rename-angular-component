import { window } from 'vscode';

export function checkForOpenUnsavedEditors() {
  return !!window.visibleTextEditors.find((editor) => editor.document.isDirty);
}
