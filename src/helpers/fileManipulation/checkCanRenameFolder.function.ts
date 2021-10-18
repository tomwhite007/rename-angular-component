import { AngularConstruct } from '../definitions/file.interfaces';
import { likeFilesRegexPartialLookup } from '../definitions/file-regex.constants';
import * as fs from 'fs';

export function checkCanRenameFolder(
  path: string,
  stub: string,
  construct: AngularConstruct
) {
  // build like-files regex
  const likeFilesRegex = RegExp(
    `^${stub}${likeFilesRegexPartialLookup[construct]}`
  );
  let foundFilesToNotRename: string[] = [];
  let findFilesToNotRenameErrorMsgs: string[] = [];

  try {
    // find files to rename
    foundFilesToNotRename = fs
      .readdirSync(path)
      .filter((file: string) => !likeFilesRegex.test(file));

    console.log('foundFilesToNotRename', foundFilesToNotRename);
  } catch {
    findFilesToNotRenameErrorMsgs = ['Finding files to not rename failed.'];
  }

  return {
    canRenameFolder: foundFilesToNotRename.length === 0,
    findFilesToNotRenameErrorMsgs,
  };
}
