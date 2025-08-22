import vscode from 'vscode';
import { genericTestScenario } from './helpers/generic-test-scenario.function';

suite('Suite Scenario 2', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Scenario 2 ng20', async () => {
    /*
    This test scenario uses a private repo as the seed to base 1 renamer test on.
    See src/test/suite/scenario1.test.ts and src/test/suite/scenario5.test.ts for publicly available test repos.
    */

    await genericTestScenario({
      projectRoot:
        '/Users/tom/Development/vscode-ext/_rename-test-spas/shp-wild-paths',
      renames: [
        {
          filePath:
            './apps/Shop/src/app/registration/registration.component.scss',
          construct: 'component',
          newFilenameInput: 'tom-test.component',
        },
      ],
      fileDiffPath: './src/test/suite/diffs/shp-wild-paths.txt',
      useNg20Convention: false,
      projectUsesStandaloneComponentsOnly: false,
    });
  });
});
