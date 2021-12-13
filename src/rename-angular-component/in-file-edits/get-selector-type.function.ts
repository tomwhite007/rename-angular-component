export function getSelectorType(selector: string) {
  return selector.match(/^[a-z]/i)
    ? 'element'
    : selector.match(/^\[/)
    ? 'attribute'
    : selector.match(/^\./)
    ? 'class'
    : null;
}
