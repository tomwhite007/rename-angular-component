import { escapeRegex } from '../../utils/escape-regex';
import { AngularConstructOrPlainFile } from '../definitions/file.interfaces';

export function renameSelectorInTemplate(
  html: string,
  originalSelector: string,
  newSelector: string,
  construct: AngularConstructOrPlainFile | null
) {
  let regExBodyStr = '';
  if (construct === 'pipe') {
    regExBodyStr = `(?<=\\| )${escapeRegex(originalSelector)}`;
  } else {
    regExBodyStr = `(?<![\\w\\-_])${escapeRegex(
      originalSelector
    )}(?![\\w\\-_])`;
  }

  const findOne = new RegExp(regExBodyStr);

  if (!html.match(findOne)) {
    return null;
  }

  const findAll = new RegExp(regExBodyStr, 'g');
  return html.replace(findAll, newSelector);
}
