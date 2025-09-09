import fs from 'fs-extra-promise';
import { Uri, window } from 'vscode';
import { AngularConstructOrPlainFile } from '../definitions/file.interfaces';
import { UserMessage } from '../logging/user-message.class';

export async function noSelectedFileHandler(
  construct: AngularConstructOrPlainFile,
  title: string,
  userMessage: UserMessage
): Promise<Uri | null> {
  const inputResult = await window.showInputBox({
    title,
    placeHolder: `Enter the full filepath of the ${construct} you want to rename`,
    prompt: `For a better experience, right-click on the file you want to rename`,
  });

  if (!inputResult) {
    return null;
  }

  if (fs.existsSync(inputResult)) {
    return Uri.file(inputResult);
  }

  userMessage.popupMessage(`Cannot find file. Stopped.`);

  return null;
}
