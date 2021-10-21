import { AngularConstruct } from '../definitions/file.interfaces';
import * as camelcase from 'camelcase';

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
      newSelector = oldSelector.replace(camelcase(stub), camelcase(newStub));
      break;
  }

  return newSelector;
}
