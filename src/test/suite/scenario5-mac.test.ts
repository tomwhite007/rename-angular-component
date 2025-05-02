import vscode from 'vscode';
import { genericTestScenario } from './helpers/generic-test-scenario.function';

suite('Suite Scenario 5', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Scenario 5', async () => {
    /*
    This test scenario uses publicly available repo: https://github.com/tomwhite007/test-rename-spa
    as the seed to base 3 renamer tests on.
    */

    await genericTestScenario({
      projectRoot:
        '/Users/tom/Development/vscode-ext/_rename-test-spas/test-rename-spa',
      renames: [
        {
          filePath: './src/app/products/products.component.spec.ts',
          construct: 'component',
          newStub: 'tom-test',
        },
        {
          filePath:
            './projects/shared/src/lib/multiply-by-ten/multiply-by-ten.directive.ts',
          construct: 'directive',
          newStub: 'dir-prop',
        },
        {
          filePath:
            './projects/shared/src/lib/multiply-by-twenty/multiply-by-twenty.directive.spec.ts',
          construct: 'directive',
          newStub: 'dir-identifier',
        },
        {
          filePath: './src/app/tom-test/products.module.ts',
          construct: 'module',
          newStub: 'tom-test',
        },
      ],
      fileDiffPath: './src/test/suite/diffs/test-rename-spa.txt',
    });
  });
});
