import { camelize, dasherize } from '../../angular-cli/strings';
import { getSelectorType } from './get-selector-type.function';
import { stripSelectorBraces } from './strip-selector-braces.function';

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
  
  // Extract the selector without markers for processing
  const selectorWithoutMarkers = stripSelectorBraces(oldSelector);
  
  let newSelector = replaceOldSelector(
    selectorWithoutMarkers,
    stub,
    originalFileWithoutType,
    newStub
  );

  if (type === 'attribute') {
    newSelector = camelize(newSelector);
    // Restore attribute brackets
    return `[${newSelector}]`;
  } else if (type === 'class') {
    // Restore class dot prefix
    return `.${newSelector}`;
  }
  
  // Element selector - return as-is
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
