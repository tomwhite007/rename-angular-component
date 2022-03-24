import assert = require('assert');
import simpleGit, { CleanOptions, ResetMode } from 'simple-git';
import { DISCARD_STAGED_CHANGES } from './constants-helper-config';
import { readUpsertDiffFile } from './read-upsert-diff-file.function';
import {
  RenameCallConfig,
  runRenamerScenario,
} from './run-renamer-scenario.function';

export interface TestScenarioConfig {
  projectRoot: string;
  renames: RenameCallConfig[];
  fileDiffPath: string;
}

export async function genericTestScenario(config: TestScenarioConfig) {
  const git = simpleGit({
    baseDir: config.projectRoot,
  });
  const discardChanges = async () => {
    if (!DISCARD_STAGED_CHANGES) {
      return;
    }
    await git.reset(['--hard', 'HEAD']);
    // unstaged changes:
    // await git.clean([CleanOptions.FORCE, CleanOptions.RECURSIVE]);
    // await git.checkout('.');
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
}
