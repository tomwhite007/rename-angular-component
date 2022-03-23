export function stripSelectorBraces(selector: string, andQuotes = false) {
  if (andQuotes) {
    selector = selector.replace(/'/g, '');
  }
  return selector.replace(/(\[|\]|\.)/g, '');
}
