export function stripSelectorBraces(selector: string) {
  return selector.replace(/(\[|\]|\.)/g, '');
}
