import { camelize, classify, dasherize } from '../../angular-cli/strings';
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
    case 'class':
      newSelector = dasherize(oldSelector).replace(
        dasherize(stub),
        dasherize(newStub)
      );
      break;
    case 'attribute':
      newSelector = camelize(
        oldSelector.replace(classify(stub), classify(newStub))
      );
      break;
  }

  return newSelector;
}
