import vscode from 'vscode';
import { genericTestScenario } from './helpers/generic-test-scenario.function';

suite('Suite Scenario 8', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Scenario 8 ng20 half circle', async () => {
    /*
    This test scenario uses publicly available repo: https://github.com/tomwhite007/ng20-latest-circle-back
    as the seed to base renamer tests on.
    */

    await genericTestScenario({
      projectRoot:
        '/Users/tom/Development/vscode-ext/_rename-test-spas/ng20-latest-circle-back',
      renames: [
        {
          filePath: './src/app/test/test.scss',
          newFilenameInput: 'foo.component',
        },
        {
          filePath:
            './src/app/test-suffix.component/test-suffix.component.spec.ts',
          newFilenameInput: 'baa',
        },
      ],
      fileDiffPath: './src/test/suite/diffs/ng20-latest-half-circle.txt',
      useNg20Convention: true,
    });
  });

  test('Scenario 8 ng20 full circle', async () => {
    /*
    This test scenario uses publicly available repo: https://github.com/tomwhite007/ng20-latest-circle-back
    as the seed to base renamer tests on.
    */

    await genericTestScenario({
      projectRoot:
        '/Users/tom/Development/vscode-ext/_rename-test-spas/ng20-latest-circle-back',
      renames: [
        {
          filePath: './src/app/test/test.scss',
          newFilenameInput: 'foo.component',
        },
        {
          filePath:
            './src/app/test-suffix.component/test-suffix.component.spec.ts',
          newFilenameInput: 'baa',
        },
        // now rename back to original
        {
          filePath: './src/app/foo.component/foo.component.scss',
          newFilenameInput: 'test',
        },
        {
          filePath: './src/app/baa/baa.spec.ts',
          newFilenameInput: 'test-suffix.component',
        },
      ],
      fileDiffPath: './src/test/suite/diffs/ng20-latest-full-circle.txt',
      useNg20Convention: true,
    });
  });

  test('Scenario 8 non-ng20 half circle', async () => {
    /*
    This test scenario uses publicly available repo: https://github.com/tomwhite007/ng20-latest-circle-back
    as the seed to base renamer tests on.
    */

    await genericTestScenario({
      projectRoot:
        '/Users/tom/Development/vscode-ext/_rename-test-spas/ng20-latest-circle-back',
      renames: [
        {
          filePath: './src/app/test/test.scss',
          newFilenameInput: 'foo.component',
        },
        {
          filePath:
            './src/app/test-suffix.component/test-suffix.component.spec.ts',
          newFilenameInput: 'baa',
        },
      ],
      fileDiffPath:
        './src/test/suite/diffs/ng20-latest-half-circle-non-ng20.txt',
      useNg20Convention: false,
    });
  });

  test('Scenario 8 non-ng20 full circle', async () => {
    /*
    This test scenario uses publicly available repo: https://github.com/tomwhite007/ng20-latest-circle-back
    as the seed to base renamer tests on.
    */

    await genericTestScenario({
      projectRoot:
        '/Users/tom/Development/vscode-ext/_rename-test-spas/ng20-latest-circle-back',
      renames: [
        {
          filePath: './src/app/test/test.scss',
          newFilenameInput: 'foo.component',
        },
        {
          filePath:
            './src/app/test-suffix.component/test-suffix.component.spec.ts',
          newFilenameInput: 'baa',
        },
        // now rename back to original
        {
          filePath: './src/app/foo/foo.component.scss',
          newFilenameInput: 'test',
        },
        {
          filePath: './src/app/baa/baa.spec.ts',
          newFilenameInput: 'test-suffix.component',
        },
      ],
      fileDiffPath:
        './src/test/suite/diffs/ng20-latest-full-circle-non-ng20.txt',
      useNg20Convention: false,
    });
  });
});
