import { conf } from '../../move-ts-indexer/util/helper-functions';

export function isProjectUsingStandaloneComponents(): boolean {
  return conf('projectUsesStandaloneComponentsOnly', true);
}
