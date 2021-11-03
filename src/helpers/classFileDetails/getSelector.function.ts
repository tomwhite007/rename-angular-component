import { AngularConstruct } from '../definitions/file.interfaces';
import { getNextWord } from './getNextWord.function';
import { capitalCase } from 'change-case';

const componentMeta = /@Component\(\{[\v\sa-zA-Z:'"\-,\.\/\[\]]*\}\)/g;
const directiveMeta = /@Directive\(\{[\v\sa-zA-Z:'"\-,\.\/\[\]]*\}\)/g;

export function getSelector(classCode: string, construct: AngularConstruct) {
  let metas: RegExpMatchArray | null = [];
  switch (construct) {
    case 'component':
      metas = classCode.match(componentMeta);
      break;
    case 'directive':
      metas = classCode.match(directiveMeta);
      break;
    default:
      return '';
  }
  if (metas?.length !== 1) {
    throw new Error(
      `Unexpected number of @${construct} Meta definitions in file`
    );
  }

  const selectors = metas[0].match(/selector:\s?('|")[a-zA-Z\-\[\]]+('|")/g);
  if (selectors?.length !== 1) {
    if (construct === 'directive') {
      // don't support .blah css selector for directives
      return '';
    }
    if (selectors?.length === 0) {
      throw new Error(`Selector not found in @${capitalCase(construct)} Meta`);
    }
    throw new Error(
      `Unexpected number of Selectors in @${capitalCase(construct)} Meta`
    );
  }

  let selectorText = selectors[0].replace(/selector:\s?/, '');
  selectorText = getNextWord(selectorText).replace(/('|")/g, '');

  return selectorText;
}
