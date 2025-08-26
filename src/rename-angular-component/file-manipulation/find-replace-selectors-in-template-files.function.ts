import fs from 'fs-extra-promise';
import path from 'path';
import { workspace } from 'vscode';
import { AngularConstructOrPlainFile } from '../definitions/file.interfaces';
import { isProjectUsingStandaloneComponents } from '../definitions/is-project-using-standalone-components';
import { renameSelectorInTemplate } from '../in-file-edits/rename-selector-in-template.function';
import { DebugLogger } from '../logging/debug-logger.class';
import { UserMessage } from '../logging/user-message.class';

export async function findReplaceSelectorsInTemplateFiles(
  originalSelector: string,
  newSelector: string,
  userMessage: UserMessage,
  construct: AngularConstructOrPlainFile | null,
  coreFilePath: string,
  baseFilePathsAffected: string[],
  debugLogger: DebugLogger
) {
  if (originalSelector === newSelector) {
    return;
  }
  const projectRoot = workspace.workspaceFolders?.[0].uri.fsPath + path.sep;
  const uris = await workspace.findFiles(
    '**/*.{html,spec.ts,component.ts,stories.ts}',
    '**/node_modules/**',
    10000
  );

  debugLogger.log(
    `ReplaceSelectorsInTemplateFiles found ${uris.length} possible template files`,
    `Avoid changing coreFilePath: ${coreFilePath}`
  );

  let changed = 0;
  let specFilesChanged = 0;
  for (const uri of uris) {
    const filePathBase = uri.fsPath.replace(
      /\.(ts|html|scss|css|sass|less)$/,
      ''
    );
    const isSpecFile = uri.fsPath.endsWith('.spec.ts');
    const isIndexFile = path.basename(uri.fsPath) === 'index.html';
    const isNotSpecOrIndexFile = !isSpecFile && !isIndexFile;
    if (
      isNotSpecOrIndexFile && // replace all selectors in spec files and index.html
      (uri.fsPath === coreFilePath || // Skip core file because selector is already updated
        (isProjectUsingStandaloneComponents() &&
          !baseFilePathsAffected.includes(filePathBase))) // Skip template files that are not siblings to files that have been edited
    ) {
      debugLogger.log(
        `Skipping ${
          uri.fsPath === coreFilePath ? 'core' : 'non-sibling'
        } file: ${uri.fsPath}`,
        `filePathBase: ${filePathBase}`
      );
      continue;
    }
    let html: string | null = await fs.readFileAsync(uri.fsPath, 'utf-8');
    if (html) {
      html = renameSelectorInTemplate(
        html,
        originalSelector,
        newSelector,
        construct
      );
    }
    if (html) {
      await fs.writeFileAsync(uri.fsPath, html, 'utf-8');
      const relativePath = uri.fsPath.replace(projectRoot, '');
      userMessage.logInfoToChannel([relativePath], false);
      changed++;
      if (isSpecFile) {
        specFilesChanged++;
      }
    }
  }
  const logMsg = `Processed ${uris.length} possible template files. Replaced ${
    construct === 'pipe' ? 'pipe names' : 'selectors'
  } in ${changed} files`;
  const specFilesMessage =
    specFilesChanged > 0
      ? [
          '',
          `Updated selectors in ${specFilesChanged} .spec files.`,
          "PLEASE NOTE: If you have duplicate selectors for different components in your tests' .spec files, you may need to revert some tests manually. PLEASE CHECK YOUR DIFF.",
          '(Duplicate selectors are not a recommended practice, and this extension will not handle tests for them automatically.)',
        ]
      : [];
  userMessage.logInfoToChannel([logMsg, ...specFilesMessage], false);
}
