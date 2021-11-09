import { OriginalFileDetails } from '../definitions/file.interfaces';
import { upperCaseFirst } from 'upper-case-first';

export function originalFileDetails(filePath: string): OriginalFileDetails {
  const lastSlash = filePath.lastIndexOf('/');

  const windowsDriveMatch = filePath.match(/^\/[a-z]:/);
  let path = filePath.substr(0, lastSlash).replace(/^\/c:/, 'C:');
  if (windowsDriveMatch) {
    path = upperCaseFirst(path.replace(/^\//, ''));
  }

  const file = filePath.substr(lastSlash + 1, filePath.length - lastSlash - 1);
  const stub = file.split(
    /\.(component|directive|service)\.(spec.ts|scss|html|ts)$/
  )[0];
  return { path, file, stub };
}
