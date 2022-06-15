import { OriginalFileDetails } from '../definitions/file.interfaces';
import { windowsFilePathFix } from '../file-manipulation/windows-file-path-fix.function';

export function getOriginalFileDetails(filePath: string): OriginalFileDetails {
  filePath = windowsFilePathFix(filePath);

  const lastSlash = filePath.lastIndexOf('/');

  let path = filePath.substr(0, lastSlash);

  const file = filePath.substr(lastSlash + 1, filePath.length - lastSlash - 1);
  const stub = file.split(
    /\.(component|directive|service|guard|module)\.(spec.ts|scss|css|sass|less|html|ts)$/
  )[0];
  return { path, file, stub, filePath };
}
