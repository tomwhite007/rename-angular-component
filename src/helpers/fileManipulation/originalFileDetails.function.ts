import { OriginalFileDetails } from '../definitions/file.interfaces';

export function originalFileDetails(filePath: string): OriginalFileDetails {
  const lastSlash = filePath.lastIndexOf('/');
  const path = filePath.substr(0, lastSlash);
  const file = filePath.substr(lastSlash + 1, filePath.length - lastSlash - 1);
  const stub = file.split(
    /\.(component|directive|service)\.(spec.ts|scss|html|ts)$/
  )[0];
  return { path, file, stub };
}
