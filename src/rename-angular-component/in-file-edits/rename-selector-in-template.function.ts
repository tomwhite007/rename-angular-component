import { escapeRegex } from '../../utils/escape-regex';

export function renameSelectorInTemplate(
  html: string,
  originalSelector: string,
  newSelector: string
) {
  const regExBodyStr = `(?<![\\w\\-_])${escapeRegex(
    originalSelector
  )}(?![\\w\\-_])`;

  const findOne = new RegExp(regExBodyStr);

  if (!html.match(findOne)) {
    return null;
  }

  const findAll = new RegExp(regExBodyStr, 'g');
  return html.replace(findAll, newSelector);
}
