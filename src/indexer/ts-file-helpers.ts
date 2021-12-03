import * as fs from 'fs-extra-promise';
import * as vscode from 'vscode';

export interface GenericEdit {
  start: number;
  end: number;
  replacement: string;
}

export function applyGenericEdits(text: string, edits: GenericEdit[]): string {
  const replaceBetween = (
    str: string,
    start: number,
    end: number,
    replacement: string
  ): string => {
    return str.substr(0, start) + replacement + str.substr(end);
  };

  edits.sort((a, b) => {
    return a.start - b.start;
  });

  let editOffset = 0;
  for (let i = 0; i < edits.length; i++) {
    const edit = edits[i];
    text = replaceBetween(
      text,
      edit.start + editOffset,
      edit.end + editOffset,
      edit.replacement
    );
    editOffset += edit.replacement.length - (edit.end - edit.start);
  }
  return text;
}

async function replaceEditsInFile(
  filePath: string,
  edits: GenericEdit[],
  output: vscode.OutputChannel
) {
  const text = await fs.readFileAsync(filePath, 'utf8');
  if (edits.length === 0) {
    return;
  }

  let newText = applyGenericEdits(text, edits);

  output.show();
  output.appendLine(filePath);

  await fs.writeFileAsync(filePath, newText, 'utf-8');
}
