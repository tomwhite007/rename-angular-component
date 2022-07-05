import { OutputChannel, workspace } from 'vscode';
import { readFile } from '../../utils/readFile.function';
import { writeFile } from '../../utils/writeFile.function';
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
    let html: string | null = await readFile(uri);
    if (html) {
      html = renameSelectorInTemplate(html, originalSelector, newSelector);
    }
    if (html) {
      await writeFile(uri, html);
      userMessage.logInfoToChannel([uri.fsPath], false);
      changed++;
    }
  }
  console.log(
    `Processed template files. Replaced selectors in ${changed} files`
  );
}
