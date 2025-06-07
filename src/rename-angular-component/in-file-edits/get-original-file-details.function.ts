import { OriginalFileDetails } from '../definitions/file.interfaces';
import { windowsFilePathFix } from '../file-manipulation/windows-file-path-fix.function';
import { getFileWithoutType } from './get-file-without-type';

export function getOriginalFileDetails(filePath: string): OriginalFileDetails {
  filePath = windowsFilePathFix(filePath);

  const lastSlash = filePath.lastIndexOf('/');

  let path = filePath.substr(0, lastSlash);

  const file = filePath.substr(lastSlash + 1, filePath.length - lastSlash - 1);
  const fileWithoutType = getFileWithoutType(file);
  const stub = file.split(
    /(\.(component|directive|pipe|service|guard|module))?\.(spec.ts|scss|css|sass|less|html|ts)$/
  )[0];
  return { path, file, fileWithoutType, stub, filePath };
}
