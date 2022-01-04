import * as fs from 'fs-extra-promise';
import * as path from 'path';

export function debugLogger(workspaceRoot: string) {
  return async (...text: string[]) => {
    const debugFilePath = path.join(
      workspaceRoot,
      'rename-angular-component-debug-log.txt'
    );

    let fileContents = '';
    if (fs.existsSync(debugFilePath)) {
      fileContents = await fs.readFileAsync(debugFilePath, 'utf-8');
    }

    for (const line of text) {
      fileContents += line + '\n';
    }

    await fs.writeFileAsync(debugFilePath, fileContents, 'utf-8');
  };
}
