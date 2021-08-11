import * as vscode from 'vscode';
import { camelCase } from 'camel-case';
import { pascalCase } from 'pascal-case';
import { paramCase } from 'param-case';
import * as fs from 'fs';
import path = require('path');

export type AngularConstruct = 'component' | 'directive' | 'service' | 'module';
export interface OriginalFileDetails {
  path: string;
  file: string;
  stub: string;
}
const componentRegexPartial = `\.component\.(spec.ts|scss|html|ts)$`;
const directiveRegexPartial = `\.directive\.(spec.ts|ts)$`;
const serviceRegexPartial = `\.service\.(spec.ts|ts)$`;
const likeFilesRegexPartialLookup: { [key: string]: string } = {
  component: componentRegexPartial,
  directive: directiveRegexPartial,
  service: serviceRegexPartial,
};

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
    return logInfo('. Empty new name entered. No files changed.', construct);
  }
  if (newStub === selectedFileDetails.stub) {
    return logInfo('. No files changed.', construct);
  }
  if (newStub.match(/^([a-z]+)+(\-[a-z]+)*$/)) {
    return logInfo('. Text entered is not kebab case.', construct);
  }
  // make sure it's kebab
  newStub = paramCase(newStub);

  let renameFolderErrorMsgs: string[] = [];
  if (construct === 'component') {
    // rename folder if component
    let newPath: string;
    ({ newPath, renameFolderErrorMsgs } = renameFolder(
      selectedFileDetails.stub,
      newStub,
      selectedFileDetails.path
    ));
    selectedFileDetails.path = newPath;
  }

  // TODO: fix rename for service
  // find files to rename
  const { foundFilesToRename, findFileErrorMsgs } = findFilesToRename(
    selectedFileDetails.path,
    selectedFileDetails.stub,
    construct
  );
  if (findFileErrorMsgs.length) {
    return logErrors(construct, [
      ...renameFolderErrorMsgs,
      ...findFileErrorMsgs,
    ]);
  }

  // rename each file
  const { renamedFiles, renameFilesErrorMsgs } = renameEachFile(
    foundFilesToRename,
    selectedFileDetails.stub,
    newStub,
    selectedFileDetails.path
  );
  if (renameFilesErrorMsgs.length) {
    return logErrors(construct, [
      ...renameFolderErrorMsgs,
      ...renameFilesErrorMsgs,
    ]);
  }

  // TODO: rename filename and folder import paths

  // TODO: rename Class name
  // TODO: rename Class imports

  // TODO: rename Selector
  // TODO: rename Selector where used in templates

  // console.log('camelCase', camelCase(stub));
  // console.log('pascalCase', pascalCase(stub));
  // console.log('paramCase', paramCase(stub));

  // console.log(vscode.workspace.getWorkspaceFolder({j}))

  logInfo(' success', construct, renameFolderErrorMsgs);
}

function findFilesToRename(
  path: string,
  stub: string,
  construct: AngularConstruct
): { foundFilesToRename: string[]; findFileErrorMsgs: string[] } {
  // build like-files regex
  const likeFilesRegex = RegExp(
    `^${stub}${likeFilesRegexPartialLookup[construct]}`
  );
  let foundFilesToRename: string[] = [];
  let findFileErrorMsgs: string[] = [];
  try {
    // find files to rename
    foundFilesToRename = fs
      .readdirSync(path)
      .filter((file: string) => likeFilesRegex.test(file));
  } catch {
    findFileErrorMsgs = ['Finding files to rename after selection failed.'];
  }

  return {
    foundFilesToRename,
    findFileErrorMsgs,
  };
}

function renameFolder(
  oldStub: string,
  newStub: string,
  path: string
): { newPath: string; renameFolderErrorMsgs: string[] } {
  let newPath: string = '';
  let renameFolderErrorMsgs: string[] = [];
  const folderRegex = RegExp(`/${oldStub}$`);

  if (path.match(folderRegex)) {
    newPath = path.replace(folderRegex, `/${newStub}`);
    try {
      fs.renameSync(path, newPath);
    } catch (e) {
      renameFolderErrorMsgs = [
        `There was a file sytem error attempting to rename folder.`,
      ];
    }
  } else {
    newPath = path;
    renameFolderErrorMsgs = [`Unable to rename containing folder.`];
  }

  return { newPath, renameFolderErrorMsgs };
}

function renameEachFile(
  foundFilesToRename: string[],
  stub: string,
  newStub: string,
  path: string
): { renamedFiles: string[]; renameFilesErrorMsgs: string[] } {
  const renamedFiles: string[] = [];
  const renameFilesErrorMsgs: string[] = [];

  foundFilesToRename.forEach((foundFile) => {
    const newFilename = foundFile.replace(RegExp(`^${stub}`), <string>newStub);

    try {
      const newFilePath = `${path}/${newFilename}`;
      fs.renameSync(`${path}/${foundFile}`, newFilePath);
      renamedFiles.push(newFilePath);
    } catch {
      renameFilesErrorMsgs.push(
        `Rename ${foundFile} to ${newFilename} failed.`
      );
    }
  });

  return { renamedFiles, renameFilesErrorMsgs };
}

function logErrors(construct: AngularConstruct, textLines?: string[]) {
  logInfo(' failed. See output tab for more details.', construct, textLines);
}

function logInfo(
  additionalInfoMessage: string,
  construct: AngularConstruct,
  textLines?: string[]
) {
  const title = `Rename Angular ${pascalCase(construct)}`;
  vscode.window.showInformationMessage(`${title}${additionalInfoMessage}`);

  if (textLines) {
    const channel = vscode.window.createOutputChannel(title);
    channel.appendLine(``);
    channel.appendLine(`*** ${title} output: ***`);
    channel.appendLine(``);
    textLines.forEach((line) => channel.appendLine(line));
    channel.show();
  }
}
