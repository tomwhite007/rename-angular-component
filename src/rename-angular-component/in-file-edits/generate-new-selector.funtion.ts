import { AngularConstruct } from '../definitions/file.interfaces';
import { camelCase } from 'change-case';

export function generateNewSelector(
  construct: AngularConstruct,
  oldSelector: string,
  stub: string,
  newStub: string
) {
  if (!oldSelector) {
    return '';
  }

  let newSelector = '';
  switch (construct) {
    case 'component':
      newSelector = oldSelector.replace(stub, newStub);
      break;
    case 'directive':
      newSelector = oldSelector.replace(camelCase(stub), camelCase(newStub));
      break;
  }

  return newSelector;
}
