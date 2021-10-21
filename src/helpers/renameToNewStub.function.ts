import {
  AngularConstruct,
  OriginalFileDetails,
} from './definitions/file.interfaces';
import { paramCase } from 'param-case';
import { pascalCase } from 'pascal-case';
import { findFilesToRename } from './fileManipulation/findFilesToRename.function';
import { getConstructClassFileDetails } from './classFileDetails/getConstructClassFileDetails.function';
import { logErrors } from './logging/logErrors.function';
import { logInfo } from './logging/logInfo.function';
import { renameClassAndImports } from './inFileEdits/renameClassAndImports.function';
import { renameSelector } from './inFileEdits/renameSelector.function';
import { applyInClassFileChanges } from './inFileEdits/applyInClassFileChanges.function';
import { renameEachFile } from './fileManipulation/renameEachFile.function';
import { renameFolderIfComponentWithNotExtraFiles as renameFolderIfComponentWithNoExtraFiles } from './logic/renameFolderIfComponentWithNoExtraFiles';
import { generateNewSelector } from './inFileEdits/generateNewSelector.funtion';

const validSelectorPattern = /^[a-zA-Z][.0-9a-zA-Z]*(:?-[a-zA-Z][.0-9a-zA-Z]*)*$/;

export function renameToNewStub(
  construct: AngularConstruct,
  newStub: string | undefined,
  selectedFileDetails: OriginalFileDetails,
  projectRoot: string
) {
  // component = 4 files, directive|service = 2 files to rename

  if (!newStub) {
    return logInfo('. Empty new name entered. No files changed.', construct);
  }
  if (newStub === selectedFileDetails.stub) {
    return logInfo('. No files changed.', construct);
  }
  if (!newStub.match(validSelectorPattern)) {
    return logInfo('. Text entered is not a valid selector.', construct);
  }
  // TODO: LATER: check if cli allows any special characters and numbers when creating services!!!
  // make sure it's kebab
  newStub = paramCase(newStub);

  // rename folder if is component
  const {
    newPath,
    folderRenamed,
    renameFolderErrorMsgs,
    findFilesToNotRenameErrorMsgs,
  } = renameFolderIfComponentWithNoExtraFiles(
    construct,
    selectedFileDetails.path,
    selectedFileDetails.stub,
    newStub
  );
  if (findFilesToNotRenameErrorMsgs.length) {
    return logErrors(construct, [...findFilesToNotRenameErrorMsgs]);
  }
  if (folderRenamed) {
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
  } = getConstructClassFileDetails(
    construct,
    renamedFiles,
    selectedFileDetails.path + '/' + newStub
  );
  if (getComponentClassFileDetailsErrorMsgs.length) {
    return logErrors(construct, getComponentClassFileDetailsErrorMsgs);
  }

  // TODO: add replace for folder if required
  const classFilePath = `${selectedFileDetails.path}/${newStub}.${construct}.ts`;
  const newClassName = `${pascalCase(newStub)}${pascalCase(construct)}`;
  const oldLocalFilePath = `${folderRenamed && selectedFileDetails.stub + '/'}${
    selectedFileDetails.stub
  }.${construct}`;
  const newLocalFilePath = `${
    folderRenamed && newStub + '/'
  }${newStub}.${construct}`;

  const newSelector = generateNewSelector(
    construct,
    classFileDetails.selector,
    selectedFileDetails.stub,
    newStub
  );

  // rename Class and Selector inside Class File
  const {
    applyInClassFileChangeSuccessMsg,
    applyInClassFileChangesErrorMsgs,
  } = applyInClassFileChanges(
    classFilePath,
    classFileDetails.className,
    newClassName,
    classFileDetails.selector,
    newSelector,
    selectedFileDetails.stub,
    newStub,
    construct
  );
  if (applyInClassFileChangesErrorMsgs.length) {
    return logErrors(construct, applyInClassFileChangesErrorMsgs);
  }

  // Rename Class and Imports
  const { renameClasssuccessMsg, renameClassErrorMsgs } = renameClassAndImports(
    projectRoot,
    classFileDetails.className,
    newClassName,
    oldLocalFilePath,
    newLocalFilePath
  );
  if (renameClassErrorMsgs.length) {
    return logErrors(construct, renameClassErrorMsgs);
  }

  // rename Selector
  const { renameSelectorSuccessMsg, renameSelectorErrorMsgs } = renameSelector(
    construct,
    projectRoot,
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
