import { camelize, dasherize } from '../../angular-cli/strings';
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
      newSelector = camelize(dasherize(oldSelector).replace(stub, newStub));
      break;
    case 'class':
      newSelector =
        '.' + camelize(dasherize(oldSelector).replace(stub, newStub));
      break;
  }

  return newSelector;
}
