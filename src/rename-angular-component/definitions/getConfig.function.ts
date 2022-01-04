import { workspace } from 'vscode';

export function getConfig<T>(property: string, defaultValue: T): T {
  return workspace
    .getConfiguration('renameAngularComponent')
    .get<T>(property, defaultValue);
}
