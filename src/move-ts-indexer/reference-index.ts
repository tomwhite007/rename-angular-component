import { is } from 'bluebird';
import * as path from 'path';
import { isPathToAnotherDir } from './util/helper-functions';
import { Reference } from './util/shared-interfaces';

function mergeSpecifiers(ref1: Reference, newSpecifiers: string[]): string[] {
  return [...new Set([...ref1.specifiers, ...newSpecifiers])];
}

export class ReferenceIndex {
  private referencedBy: { [key: string]: Reference[] } = {}; // path -> all of the files that reference it

  public references: { [key: string]: Reference[] } = {}; // path -> all of the files that it references

  public classExports: { [key: string]: string[] } = {};

  public fileCount() {
    return Object.keys(this.references).length;
  }

  //
  /**
   * Add reference (import/export path) that 'path' (index.references[key]) uses.
   *
   * Note: path references (imports/exports) the reference
   * @param reference - the import/export path
   * @param path - the key file
   * @param specifiers
   * @param isExport
   */
  public addReference(
    reference: string,
    path: string,
    specifiers: string[],
    isExport?: boolean
  ) {
    if (!this.referencedBy.hasOwnProperty(reference)) {
      this.referencedBy[reference] = [];
    }
    if (!this.references.hasOwnProperty(path)) {
      this.references[path] = [];
    }

    const existingReference = this.references[path].find((ref) => {
      return ref.path === reference;
    });
    if (!existingReference) {
      this.references[path].push({ path: reference, specifiers, isExport });
    } else {
      existingReference.specifiers = mergeSpecifiers(
        existingReference,
        specifiers
      );
    }

    const existingRefBy = this.referencedBy[reference].find((reference) => {
      return reference.path === path;
    });
    if (!existingRefBy) {
      this.referencedBy[reference].push({
        path,
        specifiers,
        isExport,
      });
    } else {
      existingRefBy.specifiers = mergeSpecifiers(existingRefBy, specifiers);
    }
  }

  public deleteByPath(path: string) {
    if (this.references.hasOwnProperty(path)) {
      this.references[path].forEach((p) => {
        if (this.referencedBy.hasOwnProperty(p.path)) {
          this.referencedBy[p.path] = this.referencedBy[p.path].filter(
            (reference) => {
              return reference.path !== path;
            }
          );
        }
      });
      delete this.references[path];
    }
  }

  // get a list of all of the files outside of this directory that reference files
  // inside of this directory.
  public getDirReferences(
    directory: string,
    fileNames: string[] = []
  ): Reference[] {
    const result: Reference[] = [];

    const added = new Set<string>();
    const whiteList = new Set<string>(fileNames);

    for (let p in this.referencedBy) {
      if (whiteList.size > 0) {
        const relative = path.relative(directory, p).split(path.sep)[0];
        if (whiteList.has(relative)) {
          this.referencedBy[p].forEach((reference) => {
            if (added.has(reference.path)) {
              return;
            }
            const relative2 = path
              .relative(directory, reference.path)
              .split(path.sep)[0];
            if (!whiteList.has(relative2)) {
              result.push(reference);
              added.add(reference.path);
            }
          });
        }
      } else if (!isPathToAnotherDir(path.relative(directory, p))) {
        this.referencedBy[p].forEach((reference) => {
          if (added.has(reference.path)) {
            return;
          }
          if (isPathToAnotherDir(path.relative(directory, reference.path))) {
            result.push(reference);
            added.add(reference.path);
          }
        });
      }
    }
    return result;
  }

  // get a list of all of the files that reference path
  public getReferences(path: string): Reference[] {
    if (this.referencedBy.hasOwnProperty(path)) {
      return this.referencedBy[path];
    }
    return [];
  }
}
