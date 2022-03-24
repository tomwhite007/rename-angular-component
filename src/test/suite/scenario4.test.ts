import * as vscode from 'vscode';
import { genericTestScenario } from './helpers/generic-test-scenario.function';

suite('Suite Scenario 4', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Scenario 4', async () => {
    await genericTestScenario({
      projectRoot:
        '/Users/tom/Development/vscode-ext/_rename-test-spas/test-paths-app',
      renames: [
        {
          filePath:
            './projects/my-service-lib/src/lib/my-service-lib.component.ts',
          construct: 'service',
          newStub: 'tom-test',
        },
      ],
      fileDiffPath: './src/test/suite/diffs/test-paths-app.txt',
    });
  });
});