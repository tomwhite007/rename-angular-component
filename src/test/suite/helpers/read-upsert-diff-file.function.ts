import path = require('path');
import { Uri, workspace } from 'vscode';
import { fileExists } from '../../../utils/fileExists.function';
import { readFile } from '../../../utils/readFile.function';
import { writeFile } from '../../../utils/writeFile.function';
import { OVERWRITE_DIFF_SNAPSHOTS } from './constants-helper-config';

export async function readUpsertDiffFile(
  localFilePath: string,
  newDiff: string
) {
  console.log(`## Snapshot OVERWRITE: ${OVERWRITE_DIFF_SNAPSHOTS} ##`);
  const extensionDevelopmentPath = path.resolve(__dirname, '../../../../');
  const fullFilePath = path.join(extensionDevelopmentPath, localFilePath);
  const fullDirPath = path.dirname(fullFilePath);

  if (OVERWRITE_DIFF_SNAPSHOTS) {
    if (!(await fileExists(Uri.file(fullDirPath)))) {
      await workspace.fs.createDirectory(Uri.file(fullDirPath));
    }
    await writeFile(Uri.file(fullFilePath), newDiff);
    return newDiff;
  } else {
    return await readFile(Uri.file(fullFilePath));
  }
}
