import * as replace from 'replace-in-file';

export function renameSelector(
  projectRoot: string,
  originalSelector: string,
  newSelector: string
) {
  const oriSelectorRegex = new RegExp(
    `(?<=<|<\\/)${originalSelector}(?=\\n|\\s|>)`,
    'g'
  );

  const options = {
    files: `${projectRoot}/**/*.html`,
    from: oriSelectorRegex,
    to: newSelector,
  };

  let renameSelectorSuccessMsg = '';
  let renameSelectorErrorMsgs: string[] = [];

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
