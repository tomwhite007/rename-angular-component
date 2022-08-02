export function windowsFilePathFix(path: string, backSlash = false) {
  const windowsDriveMatch = path.match(/^\/[a-z]:/i) || path.match(/^[a-z]:/i);
  if (windowsDriveMatch) {
    path = path.replace(
      windowsDriveMatch[0],
      windowsDriveMatch[0].toLocaleLowerCase()
    );
    path = path.replace(/^\//, '');
    if (backSlash) {
      path = path.replace(/\//g, '\\');
    } else {
      path = path.replace(/\\/g, '/');
    }
  }
  return path;
}
