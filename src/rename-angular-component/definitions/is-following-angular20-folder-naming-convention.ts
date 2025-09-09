import { conf } from '../../move-ts-indexer/util/helper-functions';

export function isFollowingAngular20FolderAndSelectorNamingConvention(): boolean {
  return conf('followAngular20FolderAndSelectorNamingConvention', false);
}
