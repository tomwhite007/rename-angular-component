import * as vscode from 'vscode';
import { genericTestScenario } from './helpers/generic-test-scenario.function';

suite('Suite Scenario 1', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Scenario 1', async () => {
    await genericTestScenario({
      projectRoot:
        '/Users/tom/Development/vscode-ext/_rename-test-spas/simple-reactive-viewmodel-example',
      renames: [
        {
          filePath:
            './src/app/shared/book-ui/book-list/book-list.component.html',
          construct: 'component',
          newStub: 'tom-test',
        },
      ],
      fileDiffPath:
        './src/test/suite/diffs/simple-reactive-viewmodel-example.txt',
    });
  });
});
