import * as replace from 'replace-in-file';
import { AngularConstruct } from '../definitions/file.interfaces';

export function renameSelector(
  construct: AngularConstruct,
  projectRoot: string,
  originalSelector: string,
  newSelector: string
) {
  let renameSelectorSuccessMsg = '';
  let renameSelectorErrorMsgs: string[] = [];
  if (
    !['component', 'directive'].includes(construct) ||
    !originalSelector ||
    !newSelector
  ) {
    return { renameSelectorSuccessMsg, renameSelectorErrorMsgs };
  }

  const oriSelectorRegex = new RegExp(
    `(?<=<|<\\/)${originalSelector}(?=\\n|\\s|>)`,
    'g'
  );

  const options = {
    files: `${projectRoot}/**/*.html`,
    from: oriSelectorRegex,
    to: newSelector,
  };

  try {
    const results = replace.replaceInFileSync(options);
    renameSelectorSuccessMsg = `Renamed selector in ${
      results.filter((res) => res.hasChanged).length
    } files.`;
  } catch (error) {
    renameSelectorErrorMsgs = ['Error when renaming Class in files'];
  }

  return { renameSelectorSuccessMsg, renameSelectorErrorMsgs };
}
