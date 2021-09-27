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
import { renameClassAndImports } from './inFileEdits/renameClassAndImports.function';
import { renameSelector } from './inFileEdits/renameSelector.function';
import { applyInClassFileChanges } from './inFileEdits/applyInClassFileChanges.function';
import { renameFolder } from './fileManipulation/renameFolder.function';
import { renameEachFile } from './fileManipulation/renameEachFile.function';

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
  if (construct === 'component') {
    // rename folder if component
    let newPath: string;
    ({ newPath, renameFolderErrorMsgs } = renameFolder(
      selectedFileDetails.stub,
      newStub,
      selectedFileDetails.path
    ));
    selectedFileDetails.path = newPath;
  }

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
  const { renamedFiles, renameFilesErrorMsgs } = renameEachFile(
    foundFilesToRename,
    selectedFileDetails.stub,
    newStub,
    selectedFileDetails.path
  );
  if (renameFilesErrorMsgs.length) {
    return logErrors(construct, [
      ...renameFolderErrorMsgs,
      ...renameFilesErrorMsgs,
    ]);
  }

  // *** External file manipulations completed ***

  // get Class name and selector details
  const {
    classFileDetails,
    getComponentClassFileDetailsErrorMsgs,
  } = getComponentClassFileDetails(
    renamedFiles,
    selectedFileDetails.path + '/' + newStub
  );
  if (getComponentClassFileDetailsErrorMsgs.length) {
    return logErrors(construct, getComponentClassFileDetailsErrorMsgs);
  }

  const classFilePath = `${selectedFileDetails.path}/${newStub}.${construct}.ts`;
  const newClassName = `${pascalCase(newStub)}${pascalCase(construct)}`;
  const oldFileName = `${selectedFileDetails.stub}.${construct}`;
  const newFileName = `${newStub}.${construct}`;
  const newSelector = classFileDetails.selector.replace(
    selectedFileDetails.stub,
    newStub
  );
  console.log('classFilePath', classFilePath);

  // rename Class and Selector inside Class File
  const {
    applyInClassFileChangeSuccessMsg,
    applyInClassFileChangesErrorMsgs,
  } = applyInClassFileChanges(
    classFilePath,
    classFileDetails.className,
    newClassName,
    classFileDetails.selector,
    newSelector
  );
  if (applyInClassFileChangesErrorMsgs.length) {
    return logErrors(construct, applyInClassFileChangesErrorMsgs);
  }

  // Rename Class and Imports
  const { renameClasssuccessMsg, renameClassErrorMsgs } = renameClassAndImports(
    classFileDetails.className,
    newClassName,
    oldFileName,
    newFileName
  );
  if (renameClassErrorMsgs.length) {
    return logErrors(construct, renameClassErrorMsgs);
  }

  // rename Selector
  const { renameSelectorSuccessMsg, renameSelectorErrorMsgs } = renameSelector(
    classFileDetails.selector,
    newSelector
  );
  if (renameSelectorErrorMsgs.length) {
    return logErrors(construct, renameSelectorErrorMsgs);
  }

  // TODO: how to limit scope? I have two apps with same named components

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

  logInfo(' success', construct, [
    ...renameFolderErrorMsgs,
    applyInClassFileChangeSuccessMsg,
    renameClasssuccessMsg,
    renameSelectorSuccessMsg,
  ]);
}
