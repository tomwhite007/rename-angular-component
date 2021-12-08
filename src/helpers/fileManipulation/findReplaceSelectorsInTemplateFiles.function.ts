import { OutputChannel, workspace } from 'vscode';
import * as fs from 'fs-extra-promise';
import { renameSelector } from '../inFileEdits/renameSelector.function';
import { AngularConstruct } from '../definitions/file.interfaces';
import { logInfo } from '../logging/logInfo.function';

export async function findReplaceSelectorsInTemplateFiles(
  construct: AngularConstruct,
  originalSelector: string,
  newSelector: string,
  output: OutputChannel
) {
  const uris = await workspace.findFiles(
    '**/*.html',
    '**/node_modules/**',
    10000
  );

  console.log(`found ${uris.length} template files`);

  let changed = 0;
  for (const uri of uris) {
    let html: string | null = await fs.readFileAsync(uri.fsPath, 'utf-8');
    if (html) {
      html = renameSelector(construct, html, originalSelector, newSelector);
    }
    if (html) {
      await fs.writeFileAsync(uri.fsPath, html, 'utf-8');
      logInfo(output, [uri.fsPath]);
      changed++;
    }
  }
  console.log(
    `Processed template files. Replaced selectors in ${changed} files`
  );
}
