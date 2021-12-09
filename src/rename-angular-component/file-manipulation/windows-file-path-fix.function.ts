import { upperCaseFirst } from 'upper-case-first';

export function windowsFilePathFix(path: string, backSlash = false) {
  const windowsDriveMatch = path.match(/^\/[a-z]:/) || path.match(/^[a-z]:/i);
  if (windowsDriveMatch) {
    path = path.replace(/^\//, '');
    if (backSlash) {
      path = path.replace(/\//g, '\\');
    } else {
      path = path.replace(/\\/g, '/');
    }
  }
  return path;
}
