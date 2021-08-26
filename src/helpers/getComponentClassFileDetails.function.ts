import { OriginalComponentClassFileDetails } from './definitions/file.interfaces';
import { componentClassFileRegexPartial } from './definitions/file-regex.constants';
import * as fs from 'fs';

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

  console.log('filesList', filesList);
  console.log('componentClassFileDetails', classFileDetails);

  // TODO: may need allowance for special chars in file path / name...
  // Inside Class File:

  // imports:
  // import[\s\{\}A-Za-z,]*["']+[@\/\.A-Za-z\-]*["']+;?

  // component meta
  // @Component\(\{[\v\sa-zA-Z:'"\-,\.\/\[\]]*\}\)

  // class line
  // export class [A-Za-z\s]+\{
  // note: remember class name can repeat in file

  // Other Files:

  // imports:
  // import[\s\{\}A-Za-z,]*["']+[@\/\.A-Za-z\-]*["']+;?
  // then replace class name wherever in the file

  // exports (barrel files)

  try {
    const data = fs.readFileSync(classFileDetails.filePath, 'utf-8');
    console.log(data);
  } catch (err) {
    getComponentClassFileDetailsErrorMsgs = [
      'Reading Class File details failed',
    ];
  }

  return { classFileDetails, getComponentClassFileDetailsErrorMsgs };
}
