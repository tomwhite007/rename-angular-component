import fs from 'fs-extra-promise';
import { workspace } from 'vscode';
import { AngularConstructOrPlainFile } from '../definitions/file.interfaces';
import { renameSelectorInTemplate } from '../in-file-edits/rename-selector-in-template.function';
import { DebugLogger } from '../logging/debug-logger.class';
import { UserMessage } from '../logging/user-message.class';

export async function findReplaceSelectorsInTemplateFiles(
  originalSelector: string,
  newSelector: string,
  userMessage: UserMessage,
  construct: AngularConstructOrPlainFile | null,
  coreFilePath: string,
  filePathsAffected: string[],
  debugLogger: DebugLogger
) {
  if (originalSelector === newSelector) {
    return;
  }
  const uris = await workspace.findFiles(
    '**/*.{html,spec.ts,component.ts,stories.ts}',
    '**/node_modules/**',
    10000
  );

  debugLogger.log(
    `ReplaceSelectorsInTemplateFiles found ${uris.length} possible template files`,
    `coreFilePath: ${coreFilePath}`
  );

  let changed = 0;
  for (const uri of uris) {
    const filePathBase = uri.fsPath.replace(
      /\.(ts|html|scss|css|sass|less)$/,
      ''
    );
    if (
      uri.fsPath === coreFilePath || // Skip core file because selector is already updated
      !filePathsAffected.includes(filePathBase) // Skip template files that are not siblings to files that have been edited
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
      userMessage.logInfoToChannel([uri.fsPath], false);
      changed++;
    }
  }
  const logMsg = `Processed ${uris.length} possible template files. Replaced ${
    construct === 'pipe' ? 'pipe names' : 'selectors'
  } in ${changed} files`;
  userMessage.logInfoToChannel([logMsg], false);
}
