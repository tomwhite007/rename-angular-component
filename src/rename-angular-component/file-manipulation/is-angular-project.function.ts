import { Uri, workspace } from 'vscode';

export async function isAngularProject(): Promise<boolean> {
  // 1. Fast check: Inspect workspace roots directly
  // This avoids waiting for a potentially slow recursive search in large monorepos
  if (workspace.workspaceFolders) {
    for (const folder of workspace.workspaceFolders) {
      // Check for angular.json at root
      try {
        await workspace.fs.stat(Uri.joinPath(folder.uri, 'angular.json'));
        return true;
      } catch {
        // Continue
      }

      // Check for nx.json at root
      try {
        await workspace.fs.stat(Uri.joinPath(folder.uri, 'nx.json'));
        return true;
      } catch {
        // Continue
      }

      // Check for package.json at root with @angular/core
      try {
        const packageJsonPath = Uri.joinPath(folder.uri, 'package.json');
        const fileContent = await workspace.fs.readFile(packageJsonPath);
        if (fileContent.toString().includes('@angular/core')) {
          return true;
        }
      } catch {
        // Continue
      }
    }
  }

  // 2. Fallback: Recursive search
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

    try {
      const fileContent = await workspace.fs.readFile(uri);
      const fileString = fileContent.toString();
      if (fileString.includes('@angular/core')) {
        return true;
      }
    } catch {
      // Ignore read errors
    }
  }

  return false;
}

