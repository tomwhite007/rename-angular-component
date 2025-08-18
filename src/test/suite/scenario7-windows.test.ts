import vscode from 'vscode';
import { genericTestScenario } from './helpers/generic-test-scenario.function';

suite('Suite Scenario 7', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Scenario 7 ng20', async () => {
    /*
    This test scenario uses publicly available repo: https://github.com/tomwhite007/test-renamer-with-ng20
    as the seed to base renamer tests on.
    */

    await genericTestScenario({
      projectRoot: 'C:\\Development\\my-stuff\\test-renamer-with-ng20',
      renames: [
        {
          filePath: './src/app/home/home.ts',
          construct: 'file',
          newFilenameInput: 'home.page',
        },
        {
          filePath: './src/app/shared/test-class-no-decorator.spec.ts',
          construct: 'file',
          newFilenameInput: 'plain-class',
        },
        {
          filePath: './src/app/shared/test-function-no-decorator.ts',
          construct: 'file',
          newFilenameInput: 'plain-function',
        },
        {
          filePath: './src/app/shared/test-guard.spec.ts',
          construct: 'file',
          newFilenameInput: 'ng-guard-function',
        },
        {
          filePath: './src/app/shared/test-interceptor.spec.ts',
          construct: 'file',
          newFilenameInput: 'ng-interceptor-function',
        },
        {
          filePath: './src/app/shared/test-resolver.ts',
          construct: 'file',
          newFilenameInput: 'ng-resolver-function',
        },
        {
          filePath: './src/app/shared/test-values.ts',
          construct: 'file',
          newFilenameInput: 'plain-enum',
        },
        {
          filePath: './src/app/shared/test.model.ts',
          construct: 'file',
          newFilenameInput: 'plain-interface',
        },
        {
          filePath: './src/app/shared/test-unrecognised-definition.ts',
          construct: 'file',
          newFilenameInput: 'plain-unrecognised-definition',
        },
        {
          filePath:
            './src/app/shared/test-shared-component/test-shared-component.spec.ts',
          construct: 'file',
          newFilenameInput: 'multi-definition-test',
        },
      ],
      fileDiffPath: './src/test/suite/diffs/ng20-all-new-features.txt',
      useNg20Convention: true,
    });
  });

  test('Scenario 7 non ng20', async () => {
    /*
    This test scenario uses publicly available repo: https://github.com/tomwhite007/test-renamer-with-ng20
    as the seed to base renamer tests on.
    */

    await genericTestScenario({
      projectRoot: 'C:\\Development\\my-stuff\\test-renamer-with-ng20',
      renames: [
        {
          filePath: './src/app/home/home.ts',
          construct: 'file',
          newFilenameInput: 'home.page',
        },
        {
          filePath: './src/app/shared/test-class-no-decorator.spec.ts',
          construct: 'file',
          newFilenameInput: 'plain-class',
        },
        {
          filePath: './src/app/shared/test-function-no-decorator.ts',
          construct: 'file',
          newFilenameInput: 'plain-function',
        },
        {
          filePath: './src/app/shared/test-guard.spec.ts',
          construct: 'file',
          newFilenameInput: 'ng-guard-function',
        },
        {
          filePath: './src/app/shared/test-interceptor.spec.ts',
          construct: 'file',
          newFilenameInput: 'ng-interceptor-function',
        },
        {
          filePath: './src/app/shared/test-resolver.ts',
          construct: 'file',
          newFilenameInput: 'ng-resolver-function',
        },
        {
          filePath: './src/app/shared/test-values.ts',
          construct: 'file',
          newFilenameInput: 'plain-enum',
        },
        {
          filePath: './src/app/shared/test.model.ts',
          construct: 'file',
          newFilenameInput: 'plain-interface',
        },
        {
          filePath: './src/app/shared/test-unrecognised-definition.ts',
          construct: 'file',
          newFilenameInput: 'plain-unrecognised-definition',
        },
        {
          filePath:
            './src/app/shared/test-shared-component/test-shared-component.spec.ts',
          construct: 'file',
          newFilenameInput: 'multi-definition-test',
        },
      ],
      fileDiffPath: './src/test/suite/diffs/ng20-all-new-features-non-ng20.txt',
      useNg20Convention: false,
    });
  });
});
