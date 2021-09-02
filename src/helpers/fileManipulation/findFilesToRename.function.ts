import { AngularConstruct } from '../definitions/file.interfaces';
import { likeFilesRegexPartialLookup } from '../definitions/file-regex.constants';
import * as fs from 'fs';

export function findFilesToRename(
  path: string,
  stub: string,
  construct: AngularConstruct
): { foundFilesToRename: string[]; findFileErrorMsgs: string[] } {
  // build like-files regex
  const likeFilesRegex = RegExp(
    `^${stub}${likeFilesRegexPartialLookup[construct]}`
  );
  let foundFilesToRename: string[] = [];
  let findFileErrorMsgs: string[] = [];

  try {
    // find files to rename
    foundFilesToRename = fs
      .readdirSync(path)
      .filter((file: string) => likeFilesRegex.test(file));
  } catch {
    findFileErrorMsgs = ['Finding files to rename after selection failed.'];
  }

  return {
    foundFilesToRename,
    findFileErrorMsgs,
  };
}
