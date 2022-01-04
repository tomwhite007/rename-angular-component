import * as fs from 'fs-extra-promise';
import * as path from 'path';

export function debugLogger(workspaceRoot: string) {
  return (...text: string[]) => {
    const debugFilePath = path.join(
      workspaceRoot,
      'rename-angular-component-debug-log.txt'
    );

    let fileContents = '';
    if (fs.existsSync(debugFilePath)) {
      fileContents = fs.readFileSync(debugFilePath, 'utf-8');
      fileContents += '\n---\n';
    }

    for (const line of text) {
      fileContents += line + '\n';
    }

    fs.writeFileSync(debugFilePath, fileContents, 'utf-8');
  };
}
