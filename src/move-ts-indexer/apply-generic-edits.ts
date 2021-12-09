export interface GenericEdit {
  start: number;
  end: number;
  replacement: string;
}

export type GenericEditsCallback = (
  filePath: string,
  text: string
) => GenericEdit[];

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
