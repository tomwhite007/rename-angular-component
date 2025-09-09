import { compatibleFileTypes } from '../definitions/file-regex.constants';

export function getFileType(file: string): string {
  // assumes file is just a file name, not a path
  const match = file.match(compatibleFileTypes);
  return match ? match[1] : '';
}
