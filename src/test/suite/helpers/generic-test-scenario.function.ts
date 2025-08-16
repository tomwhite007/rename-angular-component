import assert = require('assert');
import simpleGit from 'simple-git';
import sinon from 'sinon';
import { DISCARD_STAGED_CHANGES } from './constants-helper-config';
import { stubGetConfiguration } from './mock-get-configuration';
import { readUpsertDiffFile } from './read-upsert-diff-file.function';
import {
  RenameCallConfig,
  runRenamerScenario,
} from './run-renamer-scenario.function';

export interface TestScenarioConfig {
  projectRoot: string;
  renames: RenameCallConfig[];
  fileDiffPath: string;
  useNg20Convention: boolean;
}

export async function genericTestScenario(config: TestScenarioConfig) {
  stubGetConfiguration({
    'followAngular20+FolderNamingConvention': config.useNg20Convention ?? true,
  });

  const git = simpleGit({
    baseDir: config.projectRoot,
  });
  const discardChanges = async () => {
    if (!DISCARD_STAGED_CHANGES) {
      return;
    }
    await git.reset(['--hard', 'HEAD']);
  };

  const notClean = await git.diff(['--staged']);
  if (notClean) {
    await discardChanges();
  }

  await runRenamerScenario(config.projectRoot, config.renames);

  await git.add('.');
  const diff = await git.diff(['--staged']);

  const fileDiff = await readUpsertDiffFile(config.fileDiffPath, diff);

  await discardChanges();

  assert.strictEqual(diff, fileDiff);

  sinon.restore();
}
