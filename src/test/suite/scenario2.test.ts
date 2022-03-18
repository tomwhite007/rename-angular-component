import * as vscode from 'vscode';
import { genericTestScenario } from './helpers/generic-test-scenario.function';

suite('Suite Scenario 2', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Scenario 2', async () => {
    await genericTestScenario({
      projectRoot:
        '/Users/tom/Development/vscode-ext/_rename-test-spas/shp-wild-paths',
      filePath: './apps/Shop/src/app/registration/registration.component.scss',
      newStub: 'tom-test',
      fileDiffPath: './src/test/suite/diffs/shp-wild-paths.txt',
    });
  });
});
