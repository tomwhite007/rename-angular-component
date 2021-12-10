import { AngularConstruct } from '../definitions/file.interfaces';
import escapeStringRegexp from 'escape-string-regexp';

export function renameSelector(
  construct: AngularConstruct,
  html: string,
  originalSelector: string,
  newSelector: string
) {
  let oriSelectorRegex: RegExp;

  switch (construct) {
    case 'component':
      if (html.indexOf('</' + originalSelector + '>') < 0) {
        return null;
      }
      oriSelectorRegex = new RegExp(
        `(?<=<|<\\/)${escapeStringRegexp(originalSelector)}(?=\\n|\\s|>)`,
        'g'
      );
      break;
    case 'directive':
      originalSelector = originalSelector.replace(/\[|\]/g, '');
      if (html.indexOf(originalSelector) < 0) {
        return null;
      }
      newSelector = newSelector.replace(/\[|\]/g, '');
      oriSelectorRegex = new RegExp(
        `(?<=\\s|\[)${escapeStringRegexp(originalSelector)}(?=\\s|\]|\\=|>)`,
        'g'
      );
      break;
    default:
      throw new Error(`No clause for construct: ${construct}`);
  }

  return html.replace(oriSelectorRegex, newSelector);
}
