import assert = require('assert');
import path = require('path');
import vscode from 'vscode';
import { windowsFilePathFix } from '../../rename-angular-component/file-manipulation/windows-file-path-fix.function';
import { genericTestScenario } from './helpers/generic-test-scenario.function';

suite('Suite Scenario 1', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Drive path tests for Windows', () => {
    const testPath1 = 'C:/Users/TomWhite/dev/test1';
    const testPath2 = '/C:/Users/TomWhite/dev/test2';
    const testPath3 = 'c:\\Users\\TomWhite\\dev\\test3';

    const expected = 'c:/Users/TomWhite/dev/test';

    assert.strictEqual(windowsFilePathFix(testPath1), expected + '1');
    assert.strictEqual(windowsFilePathFix(testPath2), expected + '2');
    assert.strictEqual(windowsFilePathFix(testPath3), expected + '3');
  });

  test('Scenario 1', async () => {
    /*
    This test scenario uses publicly available repo: https://github.com/tomwhite007/simple-reactive-viewmodel-example
    as the seed to base 1 renamer test on.
    */

    await genericTestScenario({
      projectRoot: 'C:/Development/my-stuff/simple-reactive-viewmodel-example',
      renames: [
        {
          filePath:
            './src/app/shared/book-ui/book-list/book-list.component.html',
          construct: 'component',
          newStub: 'tom-test',
        },
      ],
      fileDiffPath:
        './src/test/suite/diffs/simple-reactive-viewmodel-example.txt',
    });
  });
});
