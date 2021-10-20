import * as vscode from 'vscode';
import { pascalCase } from 'pascal-case';
import { AngularConstruct } from './definitions/file.interfaces';
import { renameToNewStub } from './renameToNewStub.function';
import { originalFileDetails } from './fileManipulation/originalFileDetails.function';
import { getProjectRoot } from './definitions/getProjectRootFilePath.function';

export function rename(construct: AngularConstruct, uri: vscode.Uri) {
  const fileDetails = originalFileDetails(uri.path);
  const projectRoot = getProjectRoot(uri) as string;

  vscode.window
    .showInputBox({
      title: `Rename Angular ${pascalCase(construct)}`,
      prompt:
        'Type the new filename stub you want to rename to (use kebab / dashed case).',
      value: fileDetails.stub,
    })
    .then((newStub) =>
      renameToNewStub(construct, newStub, fileDetails, projectRoot)
    );
}
