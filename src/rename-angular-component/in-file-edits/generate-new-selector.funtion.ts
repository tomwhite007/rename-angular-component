import { AngularConstruct } from '../definitions/file.interfaces';
import { pascalCase } from 'pascal-case';

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
      const oldBit = pascalCase(stub);
      const newBit = pascalCase(newStub);
      console.log(oldSelector, oldBit, newBit);
      newSelector = oldSelector.replace(pascalCase(stub), pascalCase(newStub));
      break;
  }

  return newSelector;
}
