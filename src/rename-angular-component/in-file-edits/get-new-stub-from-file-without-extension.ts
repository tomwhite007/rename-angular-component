import { dasherize } from '../../angular-cli/strings';

export function getNewStubFromFileWithoutExtension(
  fileNameWithoutExtension: string | undefined
): string {
  // assumes the file is a file name not a path
  const fileWithoutConstruct = fileNameWithoutExtension?.split(
    /\.(component|directive)$/
  )[0];
  // make sure it's kebab, and lose the dots
  return dasherize(fileWithoutConstruct?.replace('.', '-') ?? '');
}
