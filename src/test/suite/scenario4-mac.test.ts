import vscode from 'vscode';
import { genericTestScenario } from './helpers/generic-test-scenario.function';

suite('Suite Scenario 4', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Scenario 4', async () => {
    /*
    This test scenario uses a private repo as the seed to base 1 renamer test on.
    See src/test/suite/scenario1.test.ts and src/test/suite/scenario5.test.ts for publicly available test repos.
    */

    await genericTestScenario({
      projectRoot:
        '/Users/tom/Development/vscode-ext/_rename-test-spas/test-paths-app',
      renames: [
        {
          filePath:
            './projects/my-service-lib/src/lib/my-service-lib.component.ts',
          construct: 'service',
          newFilenameInput: 'tom-test',
        },
      ],
      fileDiffPath: './src/test/suite/diffs/test-paths-app.txt',
    });
  });
});
