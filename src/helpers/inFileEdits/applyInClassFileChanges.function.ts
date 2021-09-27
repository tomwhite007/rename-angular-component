import * as replace from 'replace-in-file';

export function applyInClassFileChanges(
  filePath: string,
  originalClassName: string,
  newClassName: string,
  originalSelector: string,
  newSelector: string
) {
  console.log('applyInClassFileChanges filePath', filePath);

  const oriClassRegex = new RegExp(
    `(?<![A-Za-z]+)${originalClassName}(?![A-Za-z]+)`,
    'g'
  );
  const oriSelectorRegex = new RegExp(
    `(?<=['"]{1})${originalSelector}(?=['"]{1})`,
    'g'
  );

  const options = {
    files: filePath,
    from: [oriClassRegex, oriSelectorRegex],
    to: [newClassName, newSelector],
  };

  let applyInClassFileChangeSuccessMsg = '';
  let applyInClassFileChangesErrorMsgs: string[] = [];

  try {
    replace.sync(options);
    applyInClassFileChangeSuccessMsg = `Renamed original Class and selector`;
  } catch (error) {
    applyInClassFileChangesErrorMsgs = [
      'Error when renaming Class and selector in Class file',
    ];
  }

  return { applyInClassFileChangeSuccessMsg, applyInClassFileChangesErrorMsgs };
}
