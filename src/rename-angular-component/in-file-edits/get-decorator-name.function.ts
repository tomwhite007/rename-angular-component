import { classify } from '../../angular-cli/strings';
import { CONSTRUCTS_WITH_SELECTORS } from '../definitions/constructs-with-selectors';
import { AngularConstruct } from '../definitions/file.interfaces';

export function getDecoratorName(construct: AngularConstruct) {
  if (construct === 'module') {
    return 'NgModule';
  }
  return CONSTRUCTS_WITH_SELECTORS.includes(construct)
    ? classify(construct)
    : 'Injectable';
}
