import { camelize, dasherize } from '../../angular-cli/strings';
import { getSelectorType } from './get-selector-type.function';

export function generateNewSelector(
  oldSelector: string,
  stub: string,
  originalFileWithoutType: string,
  newStub: string
) {
  if (!oldSelector) {
    return '';
  }

  const type = getSelectorType(oldSelector);

  let newSelector = replaceOldSelector(
    oldSelector,
    stub,
    originalFileWithoutType,
    newStub
  );

  if (type === 'attribute') {
    newSelector = camelize(newSelector);
  }
  return newSelector;
}

function replaceOldSelector(
  oldSelector: string,
  stub: string,
  originalFileWithoutType: string,
  newStub: string
) {
  const oldDashedSelector = dasherize(oldSelector);
  const dashedOriginalFileWithoutType = dasherize(originalFileWithoutType);
  let newSelector: string;
  if (oldDashedSelector.endsWith(dashedOriginalFileWithoutType)) {
    newSelector = oldDashedSelector.replace(
      dashedOriginalFileWithoutType,
      dasherize(newStub)
    );
  } else {
    newSelector = oldDashedSelector.replace(
      dasherize(stub),
      dasherize(newStub)
    );
  }

  return newSelector;
}
