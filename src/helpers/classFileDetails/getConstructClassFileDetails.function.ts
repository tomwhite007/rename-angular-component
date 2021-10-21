import {
  AngularConstruct,
  OriginalComponentClassFileDetails,
} from '../definitions/file.interfaces';
import * as fs from 'fs';
import { getClassName } from './getClassName.function';
import { getSelector } from './getSelector.function';

export function getConstructClassFileDetails(
  construct: AngularConstruct,
  filesList: string[],
  stub: string
): {
  classFileDetails: OriginalComponentClassFileDetails;
  getComponentClassFileDetailsErrorMsgs: string[];
} {
  const componentClassFileRegex = RegExp(`^${stub}\.${construct}\.ts$`);
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
    classFileDetails.selector = getSelector(classCode, construct);
  } catch (e) {
    getComponentClassFileDetailsErrorMsgs = [e.message];
  }

  return { classFileDetails, getComponentClassFileDetailsErrorMsgs };
}
