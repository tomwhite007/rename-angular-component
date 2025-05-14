import { classify } from '../../angular-cli/strings';
import { AngularConstruct } from '../definitions/file.interfaces';

export function getClassName(
  newStub: string,
  construct: AngularConstruct
): string {
  const constructPostfix = ['module', 'pipe'].includes(construct)
    ? construct
    : '';

  const newClassName = `${classify(newStub)}${classify(constructPostfix)}`;

  return newClassName;
}
