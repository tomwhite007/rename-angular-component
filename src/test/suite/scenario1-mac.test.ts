import vscode from 'vscode';
import { genericTestScenario } from './helpers/generic-test-scenario.function';

suite('Suite Scenario 1', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Scenario 1', async () => {
    /*
    This test scenario uses publicly available repo: https://github.com/tomwhite007/simple-reactive-viewmodel-example
    as the seed to base 1 renamer test on.
    */

    await genericTestScenario({
      projectRoot:
        '/Users/tom/Development/vscode-ext/_rename-test-spas/simple-reactive-viewmodel-example',
      renames: [
        {
          filePath:
            './src/app/shared/book-ui/book-list/book-list.component.html',
          construct: 'component',
          newFilenameInput: 'tom-test.component',
        },
      ],
      fileDiffPath:
        './src/test/suite/diffs/simple-reactive-viewmodel-example.txt',
    });
  });
});
