import * as vscode from 'vscode';
import { genericTestScenario } from './helpers/generic-test-scenario.function';

suite('Suite Scenario 6', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Scenario 6', async () => {
    /*
    This test scenario uses publicly available repo: https://github.com/tomwhite007/test-latest-css
    as the seed to base 1 renamer test on.
    */

    await genericTestScenario({
      projectRoot:
        '/Users/tom/Development/vscode-ext/_rename-test-spas/test-ng17-css',
      renames: [
        {
          filePath: './src/app/app.component.css',
          construct: 'component',
          newStub: 'tom-test',
        },
      ],
      fileDiffPath:
        './src/test/suite/diffs/test-styleurl-and-jasminespy-app.txt',
    });
  });
});
