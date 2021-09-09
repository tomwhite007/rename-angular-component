import { getProjectRoot } from '../definitions/getProjectRootFilePath.function';
import * as replace from 'replace-in-file';
import escapeStringRegexp from 'escape-string-regexp';

export function renameClass(
  originalClassName: string,
  newClassName: string,
  oldFilePath: string,
  newFilePath: string
) {
  const oriClassRegex = new RegExp(
    `(?<![A-Za-z]+)${originalClassName}(?![A-Za-z]+)`,
    'g'
  );
  const oriImportRegex = new RegExp(
    `import[\\s\\n]+\\{[\\s\\n]+[a-z,\\s]+[\\s\\n]+\\}[\\s\\n]+from[\\s\\n]+['"]{1}[^'"\\n]+${escapeStringRegexp(
      oldFilePath
    )}['"]{1}`,
    'gi'
  );

  const options = {
    files: `${getProjectRoot()}/**/*.ts`,
    from: [oriClassRegex, oriImportRegex],
    to: [
      newClassName,
      (match: string) => match.replace(oldFilePath, newFilePath),
    ],
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
