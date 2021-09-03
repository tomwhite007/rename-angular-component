import { getProjectRoot } from '../definitions/getProjectRootFilePath.function';
import * as replace from 'replace-in-file';

export function renameClass(originalClassName: string, newClassName: string) {
  const oriClassRegex = new RegExp(
    `(?<![A-Za-z]+)${originalClassName}(?![A-Za-z]+)`,
    'g'
  );

  const options = {
    files: `${getProjectRoot()}/**/*.ts`,
    from: oriClassRegex,
    to: newClassName,
  };

  let renameClasssuccessMsg = '';
  let renameClassErrorMsgs = [''];

  try {
    const results = replace.sync(options);
    renameClasssuccessMsg = `Renamed Class in ${
      results.filter((res) => res.hasChanged).length
    } files.`;
  } catch (error) {
    renameClassErrorMsgs = ['Error when renaming Class in files'];
  }

  return { renameClasssuccessMsg, renameClassErrorMsgs };
}
