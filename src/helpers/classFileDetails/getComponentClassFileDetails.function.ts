import { OriginalComponentClassFileDetails } from '../definitions/file.interfaces';
import { componentClassFileRegexPartial } from '../definitions/file-regex.constants';
import * as fs from 'fs';
import { getClassName } from './getClassName.function';
import { getSelector } from './getSelector.function';

export function getComponentClassFileDetails(
  filesList: string[],
  stub: string
): {
  classFileDetails: OriginalComponentClassFileDetails;
  getComponentClassFileDetailsErrorMsgs: string[];
} {
  const componentClassFileRegex = RegExp(
    `^${stub}${componentClassFileRegexPartial}`
  );
  const classFileDetails: OriginalComponentClassFileDetails = {
    filePath: '',
    className: '',
    selector: '',
  };
  let getComponentClassFileDetailsErrorMsgs: string[] = [];

  classFileDetails.filePath =
    filesList.find((file: string) => componentClassFileRegex.test(file)) ?? '';
  console.log('classFileDetails.filePath', classFileDetails.filePath);

  let classCode = '';
  try {
    classCode = fs.readFileSync(classFileDetails.filePath, 'utf-8');
  } catch (err) {
    getComponentClassFileDetailsErrorMsgs = [
      'Reading Class File details failed',
    ];
    return { classFileDetails, getComponentClassFileDetailsErrorMsgs };
  }

  try {
    classFileDetails.className = getClassName(classCode);
    classFileDetails.selector = getSelector(classCode);
  } catch (e) {
    getComponentClassFileDetailsErrorMsgs = [e.message];
  }

  return { classFileDetails, getComponentClassFileDetailsErrorMsgs };
}
