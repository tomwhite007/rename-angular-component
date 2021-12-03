import { OriginalFileDetails } from '../definitions/file.interfaces';
import { upperCaseFirst } from 'upper-case-first';

export function getOriginalFileDetails(filePath: string): OriginalFileDetails {
  const lastSlash = filePath.lastIndexOf('/');

  const windowsDriveMatch = filePath.match(/^\/[a-z]:/);
  let path = filePath.substr(0, lastSlash);
  /* 
  TODO: check if old windows hack is still required: .replace(/^\/c:/, 'C:'); 
watch out that the replace to create the glob doesn't have an issue with case
  */
  if (windowsDriveMatch) {
    path = upperCaseFirst(path.replace(/^\//, ''));
  }

  const file = filePath.substr(lastSlash + 1, filePath.length - lastSlash - 1);
  const stub = file.split(
    /\.(component|directive|service)\.(spec.ts|scss|html|ts)$/
  )[0];
  return { path, file, stub };
}
