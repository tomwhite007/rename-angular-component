import { escapeRegex } from '../../utils/escape-regex';
import { getSelectorType } from './get-selector-type.function';

export function renameSelectorInTemplate(
  html: string,
  originalSelector: string,
  newSelector: string
) {
  let oriSelectorRegex: RegExp;
  const type = getSelectorType(originalSelector);

  switch (type) {
    case 'element': {
      const testRegex = new RegExp(
        `<\\/${escapeRegex(originalSelector)}(\\n|\\s|>)`
      );
      if (!html.match(testRegex)) {
        return null;
      }
      oriSelectorRegex = new RegExp(
        `(?<=<|<\\/)${escapeRegex(originalSelector)}(?=\\n|\\s|>)`,
        'g'
      );

      return html.replace(oriSelectorRegex, newSelector);
    }

    case 'attribute': {
      originalSelector = originalSelector.replace(/\[|\]/g, '');
      if (html.indexOf(originalSelector) < 0) {
        return null;
      }

      newSelector = newSelector.replace(/\[|\]/g, '');
      oriSelectorRegex = new RegExp(
        `(?<=\\s|\\[)${escapeRegex(originalSelector)}(?=\\s|\\]|\\=|>)`,
        'gm'
      );

      const replacedHtml = html.replace(oriSelectorRegex, newSelector);
      return html === replacedHtml ? null : replacedHtml;
    }

    case 'class': {
      originalSelector = originalSelector.replace(/^\./, '');
      if (html.indexOf(originalSelector) < 0) {
        return null;
      }

      newSelector = newSelector.replace(/^\./, '');
      oriSelectorRegex = new RegExp(
        `(?<=class=("|'))[_a-zA-Z0-9-\\s]*${escapeRegex(
          originalSelector
        )}[_a-zA-Z0-9-\\s]*(?="|')`,
        'gm'
      );
      const inClassRegex = new RegExp(
        `(?<=^|\\s)${escapeRegex(originalSelector)}(?=\\s|$)`,
        'gm'
      );

      const matches = html.match(oriSelectorRegex);
      if (!matches) {
        return null;
      }

      const uniqMatches = [...new Set(matches)];
      uniqMatches.forEach((matchedText) => {
        html = html.replace(
          matchedText,
          matchedText.replace(inClassRegex, newSelector)
        );
      });
      return html;
    }

    default:
      throw new Error(`No clause for selector type: ${originalSelector}`);
  }
}
