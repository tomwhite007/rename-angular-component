import { TextDecoder } from 'util';
import { Uri, workspace } from 'vscode';

/**
 * Read file using vscode fs wrapper
 * @param uri
 * @returns
 */
export async function readFile(uri: Uri) {
  const contentArray = await workspace.fs.readFile(uri);
  return new TextDecoder('utf-8').decode(contentArray);
}
