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
      projectRoot: '/Users/tom/Development/vscode-ext/_rename-test-spas/ng20',
      renames: [
        {
          filePath: './src/app/home/home.ts',
          construct: 'file',
          newFilenameInput: 'home.page',
        },
      ],
      fileDiffPath: './src/test/suite/diffs/ng20-all-new-features.txt',
    });
  });
});
