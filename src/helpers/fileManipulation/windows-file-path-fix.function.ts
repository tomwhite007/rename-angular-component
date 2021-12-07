import { upperCaseFirst } from 'upper-case-first';

export function windowsFilePathFix(path: string) {
  const windowsDriveMatch = path.match(/^\/[a-z]:/) || path.match(/^[a-z]:/i);
  if (windowsDriveMatch) {
    path = upperCaseFirst(path.replace(/^\//, '').replace(/\//g, '\\'));
  }
  return path;
}
