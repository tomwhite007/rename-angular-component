import { Uri, workspace } from 'vscode';
import * as path from 'path';

import { ReferenceIndexBuilder } from './reference-index-builder';
import { GenericEditsCallback } from './apply-generic-edits';
import { isDirectory } from '../utils/isDirectory.function';

export class FileItem {
  constructor(
    public sourcePath: string,
    public targetPath: string,
    public originalClassName?: string,
    public newClassName?: string,
    public additionalEdits?: {
      importsEdits?: GenericEditsCallback;
      movedFileEdits?: GenericEditsCallback;
    }
  ) {}

  public async move(index: ReferenceIndexBuilder) {
    if (await isDirectory(Uri.file(this.sourcePath))) {
      throw new Error(
        'This process no longer supports move / rename by directory'
      );
    } else {
      // is a file
      if (this.sourcePath.endsWith('.ts')) {
        await index.updateImports(
          this.sourcePath,
          this.targetPath,
          this.originalClassName,
          this.additionalEdits?.importsEdits
        );
      } else {
        console.log('NO updateImports for: ', this.sourcePath);
      }

      await workspace.fs.rename(
        Uri.file(this.sourcePath),
        Uri.file(this.targetPath)
      );

      if (this.sourcePath.endsWith('.ts')) {
        await index.updateMovedFile(
          this.sourcePath,
          this.targetPath,
          this.additionalEdits?.movedFileEdits
        );
      }
    }
  }
}
