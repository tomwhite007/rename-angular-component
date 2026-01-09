import { escapeRegex } from '../../utils/escape-regex';
import { AngularConstructOrPlainFile } from '../definitions/file.interfaces';
import { stripSelectorBraces } from './strip-selector-braces.function';

export function renameSelectorInTemplate(
  html: string,
  originalSelector: string,
  newSelector: string,
  construct: AngularConstructOrPlainFile | null
) {
  // For templates, selectors appear without type markers ([], .)
  // So we need to strip markers from both old and new selectors for matching/replacement
  const originalSelectorForTemplate = stripSelectorBraces(originalSelector);
  const newSelectorForTemplate = stripSelectorBraces(newSelector);
  
  let regExBodyStr = '';
  if (construct === 'pipe') {
    regExBodyStr = `(?<=\\| )${escapeRegex(originalSelectorForTemplate)}`;
  } else {
    regExBodyStr = `(?<![\\w\\-_])${escapeRegex(
      originalSelectorForTemplate
    )}(?![\\w\\-_])`;
  }

  const findOne = new RegExp(regExBodyStr);

  if (!html.match(findOne)) {
    return null;
  }

  const findAll = new RegExp(regExBodyStr, 'g');
  return html.replace(findAll, newSelectorForTemplate);
}
