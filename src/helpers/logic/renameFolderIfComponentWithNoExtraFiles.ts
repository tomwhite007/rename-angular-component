import {
  AngularConstruct,
  OriginalFileDetails,
} from '../definitions/file.interfaces';
import { checkCanRenameFolder } from '../fileManipulation/checkCanRenameFolder.function';
import { renameFolder } from '../fileManipulation/renameFolder.function';
import { logErrors } from '../logging/logErrors.function';

export function renameFolderIfComponentWithNotExtraFiles(
  construct: AngularConstruct,
  path: string,
  stub: string,
  newStub: string
) {
  let findFilesToNotRenameErrorMsgs: string[] = [];
  let renameFolderErrorMsgs: string[] = [];
  let folderRenamed = false;
  let newPath = '';
  let canRenameFolder = false;

  if (construct === 'component') {
    ({ canRenameFolder, findFilesToNotRenameErrorMsgs } = checkCanRenameFolder(
      path,
      stub,
      construct
    ));

    if (canRenameFolder) {
      ({ newPath, renameFolderErrorMsgs, folderRenamed } = renameFolder(
        stub,
        newStub,
        path
      ));
    } else {
      renameFolderErrorMsgs = ["Can't rename folder with extra files in it."];
    }
  }

  return {
    newPath,
    folderRenamed,
    renameFolderErrorMsgs,
    findFilesToNotRenameErrorMsgs,
  };
}
