import * as vscode from 'vscode';
import { camelCase } from 'camel-case';
import { pascalCase } from 'pascal-case';
import { paramCase } from 'param-case';

export type AngularConstruct = 'component' | 'directive' | 'service' | 'module';
export interface OriginalFileDetails {
  path: string;
  file: string;
  stub: string;
}
const componentRegex = /^.+\.component\.(spec.ts|scss|html|ts)$/;
const directiveRegex = /^.+\.directive\.(spec.ts|ts)$/;
const serviceRegex = /^.+\.service\.(spec.ts|ts)$/;

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
  fileDetails: OriginalFileDetails
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
  const likeFilesRegexLookup: { [key: string]: RegExp } = {
    component: componentRegex,
    directive: directiveRegex,
    service: serviceRegex,
  };
  const likeFilesRegex = likeFilesRegexLookup[construct];

  const fs = require('fs');
  fs.readdirSync(fileDetails.path).forEach((file: string) => {
    if (likeFilesRegex.test(file)) {
      console.log(file);
    }
  });

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
