import * as vscode from 'vscode';
import { genericTestScenario } from './helpers/generic-test-scenario.function';

suite('Suite Scenario 5', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Scenario 5', async () => {
    await genericTestScenario({
      projectRoot:
        '/Users/tom/Development/vscode-ext/_rename-test-spas/test-rename-spa',
      renames: [
        {
          filePath: './src/app/products/products.component.spec.ts',
          construct: 'component',
          newStub: 'tom-test',
        },
      ],
      fileDiffPath: './src/test/suite/diffs/test-rename-spa.txt',
    });
  });
});
