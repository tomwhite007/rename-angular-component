import { OutputChannel, workspace } from 'vscode';
import * as fs from 'fs-extra-promise';
import { renameSelectorInTemplate } from '../in-file-edits/rename-selector-in-template.function';
import { UserMessage } from '../logging/user-message.class';

export async function findReplaceSelectorsInTemplateFiles(
  originalSelector: string,
  newSelector: string,
  userMessage: UserMessage
) {
  if (originalSelector === newSelector) {
    return;
  }
  const uris = await workspace.findFiles(
    '**/*.{html,spec.ts,component.ts,stories.ts}',
    '**/node_modules/**',
    10000
  );

  console.log(`found ${uris.length} template files`);

  let changed = 0;
  for (const uri of uris) {
    let html: string | null = await fs.readFileAsync(uri.fsPath, 'utf-8');
    if (html) {
      html = renameSelectorInTemplate(html, originalSelector, newSelector);
    }
    if (html) {
      await fs.writeFileAsync(uri.fsPath, html, 'utf-8');
      userMessage.logInfoToChannel([uri.fsPath], false);
      changed++;
    }
  }
  console.log(
    `Processed template files. Replaced selectors in ${changed} files`
  );
}
