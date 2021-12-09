import * as Promise from 'bluebird';
import * as fs from 'fs-extra-promise';
import * as path from 'path';

import { ReferenceIndexer } from './reference-indexer';
import { GenericEdit, GenericEditsCallback } from './apply-generic-edits';

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

  public move(index: ReferenceIndexer): Promise<FileItem> {
    return this.ensureDir()
      .then(() => {
        if (this.isDir) {
          return index
            .updateDirImports(this.sourcePath, this.targetPath)
            .then(() => {
              return fs.renameAsync(this.sourcePath, this.targetPath);
            })
            .then(() => {
              return index.updateMovedDir(this.sourcePath, this.targetPath);
            })
            .then(() => {
              return this;
            });
        } else {
          return index
            .updateImports(
              this.sourcePath,
              this.targetPath,
              this.additionalEdits?.importsEdits
            )
            .then(() => {
              return fs.renameAsync(this.sourcePath, this.targetPath);
            })
            .then(() => {
              return index.updateMovedFile(
                this.sourcePath,
                this.targetPath,
                this.additionalEdits?.movedFileEdits
              );
            })
            .then(() => {
              return this;
            });
        }
      })
      .then((): any => {
        return this;
      })
      .catch((e) => {
        console.log('error in move', e);
      });
  }

  private ensureDir(): Promise<any> {
    return fs.ensureDirAsync(path.dirname(this.targetPath));
  }
}
