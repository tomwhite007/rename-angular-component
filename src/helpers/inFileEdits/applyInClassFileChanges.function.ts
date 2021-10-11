import * as replace from 'replace-in-file';

export function applyInClassFileChanges(
  filePath: string,
  originalClassName: string,
  newClassName: string,
  originalSelector: string,
  newSelector: string,
  oldStub: string,
  newStub: string,
  construct: string
) {
  const oriClassRegex = new RegExp(
    `(?<![A-Za-z]+)${originalClassName}(?![A-Za-z]+)`,
    'g'
  );
  const oriSelectorRegex = new RegExp(
    `(?<=['"]{1})${originalSelector}(?=['"]{1})`,
    'g'
  );
  const templateAndStylePathRegex = new RegExp(
    `(?<=['"]{1}\\.\\/)${oldStub}\\.${construct}(?=\\.(scss|html)['"]{1})`,
    'g'
  );

  const options = {
    files: filePath,
    from: [oriClassRegex, oriSelectorRegex, templateAndStylePathRegex],
    to: [newClassName, newSelector, `${newStub}.${construct}`],
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
