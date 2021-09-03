import {
  AngularConstruct,
  OriginalFileDetails,
} from './definitions/file.interfaces';
import { paramCase } from 'param-case';
import { pascalCase } from 'pascal-case';
import { findFilesToRename } from './fileManipulation/findFilesToRename.function';
import { getComponentClassFileDetails } from './classFileDetails/getComponentClassFileDetails.function';
import { logErrors } from './logging/logErrors.function';
import { logInfo } from './logging/logInfo.function';
import { renameClass } from './inFileEdits/renameClass.function';

export function renameToNewStub(
  construct: AngularConstruct,
  newStub: string | undefined,
  selectedFileDetails: OriginalFileDetails
) {
  // component = 4 files, directive|service = 2 files to rename

  if (!newStub) {
    return logInfo('. Empty new name entered. No files changed.', construct);
  }
  if (newStub === selectedFileDetails.stub) {
    return logInfo('. No files changed.', construct);
  }
  if (!newStub.match(/^[a-zA-Z][.0-9a-zA-Z]*(:?-[a-zA-Z][.0-9a-zA-Z]*)*$/)) {
    return logInfo('. Text entered is not a valid selector.', construct);
  }
  // TODO: LATER: check if cli allows any special characters when creating services!!!
  // make sure it's kebab
  newStub = paramCase(newStub);

  // rename folder if is component
  let renameFolderErrorMsgs: string[] = [];
  // if (construct === 'component') {
  //   // rename folder if component
  //   let newPath: string;
  //   ({ newPath, renameFolderErrorMsgs } = renameFolder(
  //     selectedFileDetails.stub,
  //     newStub,
  //     selectedFileDetails.path
  //   ));
  //   selectedFileDetails.path = newPath;
  // }

  // find files to rename
  const { foundFilesToRename, findFileErrorMsgs } = findFilesToRename(
    selectedFileDetails.path,
    selectedFileDetails.stub,
    construct
  );
  if (findFileErrorMsgs.length) {
    return logErrors(construct, [
      ...renameFolderErrorMsgs,
      ...findFileErrorMsgs,
    ]);
  }

  // rename each file
  // const { renamedFiles, renameFilesErrorMsgs } = renameEachFile(
  //   foundFilesToRename,
  //   selectedFileDetails.stub,
  //   newStub,
  //   selectedFileDetails.path
  // );
  // if (renameFilesErrorMsgs.length) {
  //   return logErrors(construct, [
  //     ...renameFolderErrorMsgs,
  //     ...renameFilesErrorMsgs,
  //   ]);
  // }

  // TODO: rename filename and folder import paths
  // TODO: fix sub folder imports afterwards

  // get Class name and selector details
  const {
    classFileDetails,
    getComponentClassFileDetailsErrorMsgs,
  } = getComponentClassFileDetails(
    foundFilesToRename.map(
      (file: string) => selectedFileDetails.path + '/' + file
    ),
    selectedFileDetails.path + '/' + selectedFileDetails.stub
  );

  // Rename Class
  const newClassName = `${pascalCase(newStub)}${pascalCase(construct)}`;
  const { renameClasssuccessMsg, renameClassErrorMsgs } = renameClass(
    classFileDetails.className,
    newClassName
  );
  if (renameClassErrorMsgs.length) {
    return logErrors(construct, renameClassErrorMsgs);
  }

  // TODO: rename Class imports

  // TODO: rename Selector
  // TODO: rename Selector where used in templates

  // TODO: may need allowance for special chars in file path / name...
  // Inside Class File:

  // imports:
  // import[\s\{\}A-Za-z,]*["']+[@\/\.A-Za-z\-]*["']+;?

  // component meta
  // @Component\(\{[\v\sa-zA-Z:'"\-,\.\/\[\]]*\}\)

  // TODO: check if selectors can be more than kebab
  // selector:\s?('|")[a-z\-]+('|"),?

  // class line
  // export class [A-Za-z\s]+\{
  // note: remember class name can repeat in file

  // Other Files:

  // imports:
  // import[\s\{\}A-Za-z,]*["']+[@\/\.A-Za-z\-]*["']+;?
  // then replace class name wherever in the file

  // exports (barrel files)

  // console.log('camelCase', camelCase(stub));
  // console.log('pascalCase', pascalCase(stub));
  // console.log('paramCase', paramCase(stub));

  // console.log(vscode.workspace.getWorkspaceFolder({j}))

  logInfo(' success', construct, renameFolderErrorMsgs);
}
