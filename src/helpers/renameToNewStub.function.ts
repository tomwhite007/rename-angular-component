import {
  AngularConstruct,
  OriginalFileDetails,
} from './definitions/file.interfaces';
import { paramCase } from 'param-case';
import { logInfo } from './logInfo.function';
import { findFilesToRename } from './findFilesToRename.function';
import { getComponentClassFileDetails } from './getComponentClassFileDetails.function';
import { logErrors } from './logErrors.function';

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

  // TODO: rename Class name
  const componentClassFileDetails = getComponentClassFileDetails(
    foundFilesToRename.map(
      (file: string) => selectedFileDetails.path + '/' + file
    ),
    selectedFileDetails.path + '/' + selectedFileDetails.stub
  );
  // TODO: rename Class imports

  // TODO: rename Selector
  // TODO: rename Selector where used in templates

  // console.log('camelCase', camelCase(stub));
  // console.log('pascalCase', pascalCase(stub));
  // console.log('paramCase', paramCase(stub));

  // console.log(vscode.workspace.getWorkspaceFolder({j}))

  logInfo(' success', construct, renameFolderErrorMsgs);
}
