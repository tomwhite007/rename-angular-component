import * as fs from 'fs';

export function renameEachFile(
  foundFilesToRename: string[],
  stub: string,
  newStub: string,
  path: string
): { renamedFiles: string[]; renameFilesErrorMsgs: string[] } {
  const renamedFiles: string[] = [];
  const renameFilesErrorMsgs: string[] = [];

  foundFilesToRename.forEach((foundFile) => {
    const newFilename = foundFile.replace(RegExp(`^${stub}`), <string>newStub);

    try {
      const newFilePath = `${path}/${newFilename}`;
      fs.renameSync(`${path}/${foundFile}`, newFilePath);
      renamedFiles.push(newFilePath);
    } catch {
      renameFilesErrorMsgs.push(
        `Rename ${foundFile} to ${newFilename} failed.`
      );
    }
  });

  return { renamedFiles, renameFilesErrorMsgs };
}
