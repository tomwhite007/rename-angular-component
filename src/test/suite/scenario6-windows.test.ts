import vscode from 'vscode';
import { genericTestScenario } from './helpers/generic-test-scenario.function';

suite('Suite Scenario 6', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Scenario 6', async () => {
    /*
    This test scenario uses publicly available repo: https://github.com/tomwhite007/test-latest-css
    as the seed to base 1 renamer test on.
    */

    await genericTestScenario({
      projectRoot: 'C:\\Development\\my-stuff\\test-ng17-css',
      renames: [
        {
          filePath: './src/app/app.component.css',
          newFilenameInput: 'tom-test.component',
        },
      ],
      fileDiffPath:
        './src/test/suite/diffs/test-styleurl-and-jasminespy-app.txt',
      useNg20Convention: false,
    });
  });
});
