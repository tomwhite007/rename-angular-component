import path = require('path');
import fs from 'fs-extra-promise';
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
      await fs.mkdir(fullDirPath);
    }
    await fs.writeFileAsync(fullFilePath, newDiff, 'utf-8');
    return newDiff;
  } else {
    return await fs.readFileAsync(fullFilePath, 'utf-8');
  }
}
