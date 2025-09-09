import path from 'path';
import { dasherize } from '../../angular-cli/strings';

export function debugFileTag(
  filePath: string,
  addTimeStamp = false,
  fullName = false
): string {
  const name = dasherize(removeExtension(path.basename(filePath)));
  const words = name.split('-');
  const initials = words.map((word) => word.charAt(0).toUpperCase()).join('');
  return fullName
    ? name
    : initials + addTimeStamp
    ? new Date().toISOString().split('T')[1]
    : '';
}

function removeExtension(filePath: string): string {
  let ext = path.extname(filePath);
  if (ext === '.ts' && filePath.endsWith('.d.ts')) {
    ext = '.d.ts';
  }
  return filePath.slice(0, -ext.length);
}
