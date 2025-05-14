import { compatibleFileTypes } from '../definitions/file-regex.constants';

export function getFileWithoutType(file: string): string {
  // assumes file is just a file name, not a path
  return file.split(compatibleFileTypes)[0];
}
