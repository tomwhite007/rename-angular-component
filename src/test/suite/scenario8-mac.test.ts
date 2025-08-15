import vscode from 'vscode';
import { genericTestScenario } from './helpers/generic-test-scenario.function';

suite('Suite Scenario 8', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Scenario 8 ng20 half circle', async () => {
    /*
    This test scenario uses publicly available repo: https://github.com/tomwhite007/ng20-latest-circle-back
    as the seed to base renamer tests on.
    */

    await genericTestScenario({
      projectRoot:
        '/Users/tom/Development/vscode-ext/_rename-test-spas/ng20-latest-circle-back',
      renames: [
        {
          filePath: './src/app/test/test.scss',
          construct: 'file',
          newFilenameInput: 'foo.component',
        },
        {
          filePath:
            './src/app/test-suffix.component/test-suffix.component.spec.ts',
          construct: 'file',
          newFilenameInput: 'baa',
        },
      ],
      fileDiffPath: './src/test/suite/diffs/ng20-latest-half-circle.txt',
      useNg20Convention: true,
    });
  });
});
