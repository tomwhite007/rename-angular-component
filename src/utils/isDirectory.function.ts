import { FileType, Uri, workspace } from 'vscode';

/**
 * Check is directory using vscode fs wrapper
 * @param uri
 * @returns
 */
export async function isDirectory(uri: Uri) {
  try {
    const stat = await workspace.fs.stat(uri);
    return stat.type === FileType.Directory;
  } catch {
    return false;
  }
}
