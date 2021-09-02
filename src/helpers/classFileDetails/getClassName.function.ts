import { getNextWord } from './getNextWord.function';

export function getClassName(classCode: string) {
  const matches = classCode.match(/export class [A-Za-z\s]+\{/g);

  if (matches?.length !== 1) {
    throw new Error('Unexpected number of Class definitions in file');
  }

  let text = matches[0].replace('export class', '');
  text = getNextWord(text);

  return text;
}
