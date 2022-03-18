import * as vscode from 'vscode';
import { genericTestScenario } from './helpers/generic-test-scenario.function';

suite('Suite Scenario 3', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Scenario 3', async () => {
    await genericTestScenario({
      projectRoot:
        '/Users/tom/Development/vscode-ext/_rename-test-spas/dsls-spa',
      filePath:
        './libs/common/util-foundation/src/lib/services/build.config.service.ts',
      newStub: 'tom-test',
      fileDiffPath: './src/test/suite/diffs/dsls-spa.txt',
    });
  });
});
