import * as vscode from 'vscode';
import { pascalCase } from 'pascal-case';
import { AngularConstruct } from './definitions/file.interfaces';
import { originalFileDetails } from './originalFileDetails.function';
import { renameToNewStub } from './renameToNewStub.function';

export function rename(construct: AngularConstruct, filePath: string) {
  const fileDetails = originalFileDetails(filePath);

  vscode.window
    .showInputBox({
      title: `Rename Angular ${pascalCase(construct)}`,
      prompt:
        'Type the new filename stub you want to rename to (use kebab / dashed case).',
      value: fileDetails.stub,
    })
    .then((newStub) => renameToNewStub(construct, newStub, fileDetails));
}
