import * as fs from 'fs-extra-promise';
import * as path from 'path';

import { ReferenceIndexer } from './reference-indexer';
import { GenericEditsCallback } from './apply-generic-edits';

export class FileItem {
  constructor(
    public sourcePath: string,
    public targetPath: string,
    public isDir: boolean,
    public originalClassName?: string,
    public newClassName?: string,
    public additionalEdits?: {
      importsEdits?: GenericEditsCallback;
      movedFileEdits?: GenericEditsCallback;
    }
  ) {}

  exists(): boolean {
    return fs.existsSync(this.targetPath);
  }

  public async move(index: ReferenceIndexer) {
    await this.ensureDir();

    if (this.isDir) {
      await index.updateDirImports(this.sourcePath, this.targetPath);

      await fs.renameAsync(this.sourcePath, this.targetPath);

      await index.updateMovedDir(this.sourcePath, this.targetPath);
    } else {
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

      await fs.renameAsync(this.sourcePath, this.targetPath);

      if (this.sourcePath.endsWith('.ts')) {
        await index.updateMovedFile(
          this.sourcePath,
          this.targetPath,
          this.additionalEdits?.movedFileEdits
        );
      }
    }
  }

  private ensureDir(): Promise<any> {
    return fs.ensureDirAsync(path.dirname(this.targetPath));
  }
}
