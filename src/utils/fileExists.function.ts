import { Uri, workspace } from 'vscode';

/**
 * Check file exists using vscode fs wrapper
 * @param uri
 * @returns
 */
export async function fileExists(uri: Uri) {
  try {
    await workspace.fs.readFile(uri);
    return true;
  } catch {
    return false;
  }
}
