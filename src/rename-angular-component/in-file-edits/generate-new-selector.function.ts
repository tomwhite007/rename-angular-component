import { camelCase, paramCase } from 'change-case';
import { getSelectorType } from './get-selector-type.function';

export function generateNewSelector(
  oldSelector: string,
  stub: string,
  newStub: string
) {
  if (!oldSelector) {
    return '';
  }

  const type = getSelectorType(oldSelector);

  let newSelector = '';
  switch (type) {
    case 'element':
      newSelector = oldSelector.replace(stub, newStub);
      break;
    case 'attribute':
      newSelector =
        '[' + camelCase(paramCase(oldSelector).replace(stub, newStub)) + ']';
      break;
    case 'class':
      newSelector =
        '.' + camelCase(paramCase(oldSelector).replace(stub, newStub));
      break;
  }

  return newSelector;
}
