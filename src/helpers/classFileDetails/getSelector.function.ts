import { AngularConstruct } from '../definitions/file.interfaces';
import { getNextWord } from './getNextWord.function';

export function getSelector(classCode: string, construct: AngularConstruct) {
  if (!['component', 'directive'].includes(construct)) {
    return '';
  }
  const metas = classCode.match(
    /@Component\(\{[\v\sa-zA-Z:'"\-,\.\/\[\]]*\}\)/g
  );
  if (metas?.length !== 1) {
    throw new Error('Unexpected number of @Component Meta definitions in file');
  }

  const selectors = metas[0].match(/selector:\s?('|")[a-z\-]+('|")/g);
  if (selectors?.length !== 1) {
    throw new Error(
      'Unexpected number of Component Selectors in @Component Meta'
    );
  }

  let selectorText = selectors[0].replace(/selector:\s?/, '');
  selectorText = getNextWord(selectorText).replace(/('|")/g, '');

  return selectorText;
}
