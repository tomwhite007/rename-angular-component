import { conf } from '../../move-ts-indexer/util/helper-functions';

export function isFollowingAngular20FolderNamingConvention(): boolean {
  return conf('followAngular20+FolderNamingConvention', true);
}
