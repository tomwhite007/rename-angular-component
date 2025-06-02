import { classify } from '../../angular-cli/strings';
import { AngularConstruct } from '../definitions/file.interfaces';

export function getNewClassName(
  newStub: string,
  newFilenameInput: string,
  construct: AngularConstruct
): string {
  const newFileEndsWithConstruct = newFilenameInput.endsWith(`.${construct}`);
  const constructPostfix =
    ['module', 'pipe'].includes(construct) || newFileEndsWithConstruct
      ? construct
      : '';

  const newClassName = `${classify(newStub)}${classify(constructPostfix)}`;

  return newClassName;
}
