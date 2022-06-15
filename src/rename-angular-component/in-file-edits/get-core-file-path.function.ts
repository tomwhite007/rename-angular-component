import { FileToMove } from '../file-manipulation/files-related-to-stub.class';

export function getCoreFilePath(filesToMove: FileToMove[]) {
  let coreConstructs = filesToMove.filter((f) => f.isCoreConstruct);
  // TODO: add logic for handling core router modules
  return coreConstructs[0]?.filePath;
}
