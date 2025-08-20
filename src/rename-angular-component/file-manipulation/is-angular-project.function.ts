import { workspace } from 'vscode';

export async function isAngularProject(): Promise<boolean> {
  const uris = await workspace.findFiles(
    '**/{angular.json,package.json}',
    '**/node_modules/**',
    10000
  );

  if (uris.length === 0) {
    return false;
  }

  for (const uri of uris) {
    if (uri.fsPath.endsWith('angular.json')) {
      return true;
    }

    const fileContent = await workspace.fs.readFile(uri);
    const fileString = fileContent.toString();
    if (fileString.includes('@angular/core')) {
      return true;
    }
  }

  return false;
}
