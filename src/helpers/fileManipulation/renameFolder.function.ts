import * as fs from 'fs';

export function renameFolder(oldStub: string, newStub: string, path: string) {
  let newPath: string = '';
  let renameFolderErrorMsgs: string[] = [];
  const folderRegex = RegExp(`/${oldStub}$`);
  let folderRenamed = false;

  if (path.match(folderRegex)) {
    newPath = path.replace(folderRegex, `/${newStub}`);
    try {
      fs.renameSync(path, newPath);
      folderRenamed = true;
    } catch (e) {
      renameFolderErrorMsgs = [
        `There was a file sytem error attempting to rename folder.`,
      ];
    }
  } else {
    newPath = path;
    renameFolderErrorMsgs = [
      `Containing folder doesn't match naming convention, so not renamed.`,
    ];
  }

  return { newPath, renameFolderErrorMsgs, folderRenamed };
}
