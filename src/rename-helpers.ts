import * as vscode from 'vscode';
import { camelCase } from 'camel-case';
import { pascalCase } from 'pascal-case';
import { paramCase } from 'param-case';
import * as fs from 'fs';

export type AngularConstruct = 'component' | 'directive' | 'service' | 'module';
export interface OriginalFileDetails {
  path: string;
  file: string;
  stub: string;
}
const componentRegex = /^.+\.component\.(spec.ts|scss|html|ts)$/;
const directiveRegex = /^.+\.directive\.(spec.ts|ts)$/;
const serviceRegex = /^.+\.service\.(spec.ts|ts)$/;
const likeFilesRegexLookup: { [key: string]: RegExp } = {
  component: componentRegex,
  directive: directiveRegex,
  service: serviceRegex,
};

export function rename(construct: AngularConstruct, filePath: string) {
  const fileDetails = originalFileDetails(filePath);

  vscode.window
    .showInputBox({
      title: 'Rename file stub',
      prompt:
        'Type the new filename stub you want to rename to (use kebab / dashed case).',
      value: fileDetails.stub,
    })
    .then((newStub) => renameToNewStub(construct, newStub, fileDetails));
  // Display a message box to the user
  vscode.window.showInformationMessage(
    `FAKE Successfully renamed ${construct}`
  );
}

function originalFileDetails(filePath: string): OriginalFileDetails {
  const lastSlash = filePath.lastIndexOf('/');
  const path = filePath.substr(0, lastSlash);
  const file = filePath.substr(lastSlash + 1, filePath.length - lastSlash - 1);
  const stub = file.split(
    /\.(component|directive|service)\.(spec.ts|scss|html|ts)$/
  )[0];
  return { path, file, stub };
}

function renameToNewStub(
  construct: AngularConstruct,
  newStub: string | undefined,
  selectedFileDetails: OriginalFileDetails
) {
  // component = 4 files, directive|service = 2 files to rename

  if (!newStub) {
    vscode.window.showInformationMessage(
      'Empty new name entered. No files changed.'
    );
    return;
  }

  // make sure it's kebab
  newStub = paramCase(newStub);

  // select the right regex
  const likeFilesRegex = likeFilesRegexLookup[construct];

  const foundFilesToRename: string[] = fs
    .readdirSync(selectedFileDetails.path)
    .filter(
      (file: string) =>
        likeFilesRegex.test(file) && file.startsWith(selectedFileDetails.stub)
    );

  foundFilesToRename.forEach((foundFile) => {
    const newFilename = foundFile.replace(
      RegExp(`^${selectedFileDetails.stub}`),
      <string>newStub
    );
    fs.renameSync(
      `${selectedFileDetails.path}/${foundFile}`,
      `${selectedFileDetails.path}/${newFilename}`
    );
  });

  vscode.window.showInformationMessage(
    `Successfully renamed!
    How about that?`
  );

  // console.log('camelCase', camelCase(stub));
  // console.log('pascalCase', pascalCase(stub));
  // console.log('paramCase', paramCase(stub));

  // console.log(vscode.workspace.getWorkspaceFolder({j}))

  // var fs = require('fs');
  // fs.rename(filePath, `${path}/test.txt`, function (err: string) {
  //   if (err) {
  //     console.log('ERROR: ' + err);
  //   }
  // });
}
