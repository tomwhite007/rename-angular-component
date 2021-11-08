import * as vscode from 'vscode';
import { pascalCase } from 'pascal-case';
import { AngularConstruct } from './definitions/file.interfaces';
import { renameToNewStub } from './renameToNewStub.function';
import { originalFileDetails } from './fileManipulation/originalFileDetails.function';
import { getProjectRoot } from './definitions/getProjectRootFilePath.function';

export function rename(construct: AngularConstruct, uri: vscode.Uri) {
  const fileDetails = originalFileDetails(uri.path);
  const projectRoot = getProjectRoot(uri) as string;
  const title = `Rename Angular ${pascalCase(construct)}`;

  vscode.window
    .showInputBox({
      title,
      prompt: `Enter the new ${construct} name.`,
      value: fileDetails.stub,
    })
    .then((newStub) => {
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          title: title + ' in progress',
          cancellable: false,
        },
        async (progress) => {
          progress.report({ increment: 0 });

          const p = new Promise<void>((resolve) => {
            setTimeout(() => {
              renameToNewStub(construct, newStub, fileDetails, projectRoot);
              progress.report({ increment: 100 });
              resolve();
            }, 0);
          });

          return p;
        }
      );
    });
}
