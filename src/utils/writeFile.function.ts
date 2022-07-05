import { TextEncoder } from 'util';
import { Uri, workspace } from 'vscode';

/**
 * Write file using vscode fs wrapper
 * @param uri
 * @param content
 */
export async function writeFile(uri: Uri, content: string) {
  const contentArray = new TextEncoder().encode(content);
  await workspace.fs.writeFile(uri, contentArray);
}
