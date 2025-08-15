import { camelize, classify } from '../../angular-cli/strings';
import {
  AngularConstructOrPlainFile,
  DefinitionType,
} from '../definitions/file.interfaces';

export function getNewDefinitionName(
  newFilenameInput: string,
  construct: AngularConstructOrPlainFile | null,
  definitionType: DefinitionType
): string {
  const endsWithConstruct = new RegExp(`[\.\-](${construct})$`);
  const newFileEndsWithConstruct = endsWithConstruct.test(
    newFilenameInput.toLowerCase()
  );
  const constructSuffix =
    ['module', 'pipe'].includes(construct ?? '') && !newFileEndsWithConstruct
      ? construct ?? ''
      : '';

  const definitionsWithCapitalFirstLetter = ['class', 'interface', 'enum'];
  const newStub = newFilenameInput.replace('.', '-');
  const newStubName = definitionsWithCapitalFirstLetter.includes(
    definitionType ?? ''
  )
    ? classify(newStub)
    : camelize(newStub);
  const newName = `${newStubName}${classify(constructSuffix)}`;

  return newName;
}
