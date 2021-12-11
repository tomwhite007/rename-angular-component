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
      originalSelector = originalSelector.replace(/\.|\[|\]/g, '');
      if (html.indexOf(originalSelector) < 0) {
        return null;
      }

      // standard attribute [a-z] selector
      if (originalSelector.startsWith('[')) {
        newSelector = newSelector.replace(/\[|\]/g, '');
        oriSelectorRegex = new RegExp(
          `(?<=\\s|\\[)${escapeStringRegexp(
            originalSelector
          )}(?=\\s|\\]|\\=|>)`,
          'gm'
        );

        // class .a-z selector
      } else if (originalSelector.startsWith('.')) {
        newSelector = newSelector.replace(/^\./, '');
        oriSelectorRegex = new RegExp(
          `(?<=class=("|'))[.\\s]*${escapeStringRegexp(
            originalSelector
          )}[.\\s]*(?="|')`,
          'gm'
        );
        const inClassRegex = new RegExp(
          `(?<=("|')|\s)${escapeStringRegexp(originalSelector)}(?=\s|("|'))`,
          'gm'
        );

        // loop through matches and do sub-replacements
        html.match(originalSelector)?.forEach((matchedText) => {
          html = html.replace(
            matchedText,
            matchedText.replace(inClassRegex, newSelector)
          );
        });
        return html;
      } else {
        console.error(
          `originalSelector for directive is '${originalSelector}'. I can't handle that; no replace.`
        );
        return null;
      }
      break;
    default:
      throw new Error(`No clause for construct: ${construct}`);
  }

  return html.replace(oriSelectorRegex, newSelector);
}
