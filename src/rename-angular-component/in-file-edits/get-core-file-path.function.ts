import { FileToMove } from '../file-manipulation/files-related-to-stub.class';

export function getCoreFilePath(filesToMove: FileToMove[]) {
  let coreConstructs = filesToMove.filter((f) => f.isCoreConstruct);
  if (coreConstructs.length > 1) {
    // routing module is also a core construct file
    coreConstructs = coreConstructs.filter(
      (f) => !f.filePath.endsWith('-routing.module.ts')
    );
  }
  return coreConstructs[0]?.filePath;
}
