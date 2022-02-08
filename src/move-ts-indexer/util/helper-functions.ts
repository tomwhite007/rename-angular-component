import * as path from 'path';
import { workspace } from 'vscode';
import { Reference } from './shared-interfaces';

export function isInDir(dir: string, p: string) {
  const relative = path.relative(dir, p);
  return !isPathToAnotherDir(relative);
}

export function asUnix(fsPath: string) {
  return fsPath.replace(/\\/g, '/');
}

export function isPathToAnotherDir(path: string) {
  return path.startsWith('../') || path.startsWith('..\\');
}

export function mergeReferenceArrays(
  arr1: Reference[],
  arr2: Reference[]
): Reference[] {
  return [
    ...arr1,
    ...arr2.filter((r2) => !arr1.find((r1) => r1.path === r2.path)),
  ];
}

export function conf<T>(property: string, defaultValue: T): T {
  return workspace
    .getConfiguration('renameAngularComponent')
    .get<T>(property, defaultValue);
}
