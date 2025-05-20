import { compatibleFileTypes } from '../definitions/file-regex.constants';

export function removeExtension(file: string): string {
  return file.replace(compatibleFileTypes, '');
}
