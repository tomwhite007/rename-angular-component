import * as assert from 'assert';
import * as vscode from 'vscode';
import simpleGit, { CleanOptions } from 'simple-git';
import { runRenamerScenario } from './helpers/run-renamer-scenario.function';
import { readUpsertDiffFile } from './helpers/read-upsert-diff-file.function';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Sample test', async () => {
    const git = simpleGit({
      baseDir:
        '/Users/tom/Development/vscode-ext/_rename-test-spas/shp-wild-paths',
    });
    const discardChanges = async () => {
      await git.clean([CleanOptions.FORCE, CleanOptions.RECURSIVE]);
      await git.checkout('.');
    };

    const notClean = await git.diff();
    if (notClean) {
      await discardChanges();
    }

    await runRenamerScenario(
      '/Users/tom/Development/vscode-ext/_rename-test-spas/shp-wild-paths',
      './apps/Shop/src/app/registration/registration.component.scss',
      'tom-test'
    );

    const diff = await git.diff();

    const fileDiff = await readUpsertDiffFile(
      './src/test/suite/diffs/shp-wild-paths.txt',
      diff
    );

    assert.strictEqual(diff, fileDiff);

    await discardChanges();
  });
});

/*
  Todo:

  Make Overwrite an npm param

  make tests open different projects

  run all tests from a config array

*/
