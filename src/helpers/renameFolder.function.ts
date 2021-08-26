import * as fs from 'fs';

export function renameFolder(
  oldStub: string,
  newStub: string,
  path: string
): { newPath: string; renameFolderErrorMsgs: string[] } {
  let newPath: string = '';
  let renameFolderErrorMsgs: string[] = [];
  const folderRegex = RegExp(`/${oldStub}$`);

  if (path.match(folderRegex)) {
    newPath = path.replace(folderRegex, `/${newStub}`);
    try {
      fs.renameSync(path, newPath);
    } catch (e) {
      renameFolderErrorMsgs = [
        `There was a file sytem error attempting to rename folder.`,
      ];
    }
  } else {
    newPath = path;
    renameFolderErrorMsgs = [`Unable to rename containing folder.`];
  }

  return { newPath, renameFolderErrorMsgs };
}
