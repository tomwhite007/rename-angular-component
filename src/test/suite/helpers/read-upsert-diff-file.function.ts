import path = require('path');
import { workspace } from 'vscode';
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
    if (!fs.existsSync(fullDirPath)) {
      await workspace.fs.mkdir(fullDirPath);
    }
    await workspace.fs.writeFileAsync(fullFilePath, newDiff, 'utf-8');
    return newDiff;
  } else {
    return await workspace.fs.readFileAsync(fullFilePath, 'utf-8');
  }
}
