import * as vscode from 'vscode';
import { camelCase } from 'camel-case';
import { pascalCase } from 'pascal-case';
import { paramCase } from 'param-case';

export type AngularConstruct = 'component' | 'directive' | 'service' | 'module';

export function rename(construct: AngularConstruct, filePath: string) {
  const lastSlash = filePath.lastIndexOf('/');
  const path = filePath.substr(0, lastSlash);
  const file = filePath.substr(lastSlash + 1, filePath.length - lastSlash - 1);
  const stub = file.split(
    /\.(component|directive|service)\.(spec.ts|scss|html|ts)$/
  )[0];

  console.log('camelCase', camelCase(stub));
  console.log('pascalCase', pascalCase(stub));
  console.log('paramCase', paramCase(stub));

  // component = 4 files, directive|service = 2 files to rename

  // console.log(vscode.workspace.getWorkspaceFolder({j}))

  // var fs = require('fs');
  // fs.rename(filePath, `${path}/test.txt`, function (err: string) {
  //   if (err) {
  //     console.log('ERROR: ' + err);
  //   }
  // });

  vscode.window.showInputBox({
    title: 'Rename file stub',
    prompt: 'Type the new filename stub you want to rename to. Use kebab case.',
    value: stub,
  });
  // Display a message box to the user
  vscode.window.showInformationMessage(
    `FAKE Successfully renamed ${construct}`
  );
}
