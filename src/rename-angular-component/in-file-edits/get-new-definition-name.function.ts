import { camelize, classify } from '../../angular-cli/strings';
import {
  AngularConstructOrPlainFile,
  DefinitionType,
} from '../definitions/file.interfaces';

export function getNewDefinitionName(
  newStub: string,
  newFilenameInput: string,
  construct: AngularConstructOrPlainFile | null,
  definitionType: DefinitionType
): string {
  const newFileEndsWithConstruct = newFilenameInput.endsWith(`.${construct}`);
  const constructPostfix =
    ['module', 'pipe'].includes(construct ?? '') || newFileEndsWithConstruct
      ? construct ?? ''
      : '';

  const newStubName =
    definitionType === 'class' ? classify(newStub) : camelize(newStub);
  const newName = `${newStubName}${classify(constructPostfix)}`;

  return newName;
}
