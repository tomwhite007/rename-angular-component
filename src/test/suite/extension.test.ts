import * as assert from 'assert';
import * as vscode from 'vscode';
import simpleGit from 'simple-git';
import { runRenamerScenario } from './helpers/run-renamer-scenario.function';
import { readUpsertDiffFile } from './helpers/read-upsert-diff-file.function';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Sample test', async () => {
    await runRenamerScenario(
      '/Users/tom/Development/my-stuff/simple-reactive-viewmodel-example/src/app/shared/book-ui/book-list/book-list.component.html',
      'tom-test'
    );

    const diff = await simpleGit({
      baseDir:
        '/Users/tom/Development/my-stuff/simple-reactive-viewmodel-example/',
    }).diff();

    const fileDiff = await readUpsertDiffFile(
      './src/test/suite/diffs/simple-reactive-viewmodel-example.txt',
      diff
    );

    assert.strictEqual(diff, fileDiff);
  });
});

/*
  Todo:

  Make Overwrite an npm param

  make tests open different projects

  run all tests from a config array

*/
