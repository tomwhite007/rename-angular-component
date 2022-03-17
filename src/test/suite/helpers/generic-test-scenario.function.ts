import assert = require('assert');
import simpleGit, { CleanOptions } from 'simple-git';
import { readUpsertDiffFile } from './read-upsert-diff-file.function';
import { runRenamerScenario } from './run-renamer-scenario.function';

export interface TestScenarioConfig {
  projectRoot: string;
  filePath: string;
  newStub: string;
  fileDiffPath: string;
}

export async function genericTestScenario(config: TestScenarioConfig) {
  const git = simpleGit({
    baseDir: config.projectRoot,
  });
  const discardChanges = async () => {
    await git.clean([CleanOptions.FORCE, CleanOptions.RECURSIVE]);
    await git.checkout('.');
  };

  const notClean = await git.diff();
  if (notClean) {
    await discardChanges();
  }

  await runRenamerScenario(config.projectRoot, config.filePath, config.newStub);

  const diff = await git.diff();

  const fileDiff = await readUpsertDiffFile(config.fileDiffPath, diff);

  assert.strictEqual(diff, fileDiff);

  await discardChanges();
}
