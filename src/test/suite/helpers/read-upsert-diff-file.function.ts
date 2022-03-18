import path = require('path');
import * as fs from 'fs-extra-promise';

const OVERWRITE = false;

export async function readUpsertDiffFile(
  localFilePath: string,
  newDiff: string
) {
  console.log(`## Snapshot OVERWRITE: ${OVERWRITE} ##`);
  const extensionDevelopmentPath = path.resolve(__dirname, '../../../../');
  const fullFilePath = path.join(extensionDevelopmentPath, localFilePath);
  const fullDirPath = path.dirname(fullFilePath);

  if (OVERWRITE) {
    if (!fs.existsSync(fullDirPath)) {
      await fs.mkdir(fullDirPath);
    }
    await fs.writeFileAsync(fullFilePath, newDiff, 'utf-8');
    return newDiff;
  } else {
    return await fs.readFileAsync(fullFilePath, 'utf-8');
  }
}
