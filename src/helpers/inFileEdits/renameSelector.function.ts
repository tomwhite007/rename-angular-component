import { getProjectRoot } from '../definitions/getProjectRootFilePath.function';
import * as replace from 'replace-in-file';

export function renameSelector(originalSelector: string, newSelector: string) {
  const oriSelectorRegex = new RegExp(
    `(?<=<|<\\/)${originalSelector}(?=\\n|\\s|>)`,
    'g'
  );

  const options = {
    files: `${getProjectRoot()}/**/*.html`,
    from: oriSelectorRegex,
    to: newSelector,
  };

  let renameSelectorSuccessMsg = '';
  let renameSelectorErrorMsgs = [''];

  try {
    const results = replace.sync(options);
    renameSelectorSuccessMsg = `Renamed selector in ${
      results.filter((res) => res.hasChanged).length
    } files.`;
  } catch (error) {
    renameSelectorErrorMsgs = ['Error when renaming Class in files'];
  }

  return { renameSelectorSuccessMsg, renameSelectorErrorMsgs };
}
