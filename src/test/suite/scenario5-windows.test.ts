import vscode from 'vscode';
import { genericTestScenario } from './helpers/generic-test-scenario.function';

suite('Suite Scenario 5', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Scenario 5 ng20', async () => {
    /*
    This test scenario uses publicly available repo: https://github.com/tomwhite007/test-rename-spa
    as the seed to base 3 renamer tests on.
    */

    await genericTestScenario({
      projectRoot: 'C:\\Development\\my-stuff\\test-rename-spa',
      renames: [
        {
          filePath: './src/app/products/products.component.spec.ts',
          newFilenameInput: 'tom-test.component',
        },
        {
          filePath:
            './projects/shared/src/lib/multiply-by-ten/multiply-by-ten.directive.ts',
          newFilenameInput: 'dir-prop.directive',
        },
        {
          filePath:
            './projects/shared/src/lib/multiply-by-twenty/multiply-by-twenty.directive.spec.ts',
          newFilenameInput: 'dir-identifier.directive',
        },
        {
          filePath: './src/app/tom-test.component/products.module.ts',
          newFilenameInput: 'tom-test.module',
        },
        {
          filePath: './src/app/tom-test.component/product.pipe.ts',
          newFilenameInput: 'formatter',
        },
      ],
      fileDiffPath: './src/test/suite/diffs/test-rename-spa-ng20.txt',
      useNg20Convention: true,
      projectUsesStandaloneComponentsOnly: false,
    });
  });

  test('Scenario 5 non ng20', async () => {
    /*
    This test scenario uses publicly available repo: https://github.com/tomwhite007/test-rename-spa
    as the seed to base 3 renamer tests on.
    */

    await genericTestScenario({
      projectRoot: 'C:\\Development\\my-stuff\\test-rename-spa',
      renames: [
        {
          filePath: './src/app/products/products.component.spec.ts',
          newFilenameInput: 'tom-test.component',
        },
        {
          filePath:
            './projects/shared/src/lib/multiply-by-ten/multiply-by-ten.directive.ts',
          newFilenameInput: 'dir-prop.directive',
        },
        {
          filePath:
            './projects/shared/src/lib/multiply-by-twenty/multiply-by-twenty.directive.spec.ts',
          newFilenameInput: 'dir-identifier.directive',
        },
        {
          filePath: './src/app/tom-test/products.module.ts',
          newFilenameInput: 'tom-test.module',
        },
        {
          filePath: './src/app/tom-test/product.pipe.ts',
          newFilenameInput: 'formatter',
        },
      ],
      fileDiffPath: './src/test/suite/diffs/test-rename-spa-non-ng20.txt',
      useNg20Convention: false,
      projectUsesStandaloneComponentsOnly: false,
    });
  });
});
