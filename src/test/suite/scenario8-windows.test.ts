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
      projectRoot: 'C:\\Development\\my-stuff\\ng20-latest-circle-back',
      renames: [
        {
          filePath: './src/app/test/test.scss',
          construct: 'file',
          newFilenameInput: 'foo.component',
        },
        {
          filePath:
            './src/app/test-suffix.component/test-suffix.component.spec.ts',
          construct: 'file',
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
      projectRoot: 'C:\\Development\\my-stuff\\ng20-latest-circle-back',
      renames: [
        {
          filePath: './src/app/test/test.scss',
          construct: 'file',
          newFilenameInput: 'foo.component',
        },
        {
          filePath:
            './src/app/test-suffix.component/test-suffix.component.spec.ts',
          construct: 'component',
          newFilenameInput: 'baa',
        },
        // now rename back to original
        {
          filePath: './src/app/foo.component/foo.component.scss',
          construct: 'component',
          newFilenameInput: 'test',
        },
        {
          filePath: './src/app/baa/baa.spec.ts',
          construct: 'file',
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
      projectRoot: 'C:\\Development\\my-stuff\\ng20-latest-circle-back',
      renames: [
        {
          filePath: './src/app/test/test.scss',
          construct: 'file',
          newFilenameInput: 'foo.component',
        },
        {
          filePath:
            './src/app/test-suffix.component/test-suffix.component.spec.ts',
          construct: 'component',
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
      projectRoot: 'C:\\Development\\my-stuff\\ng20-latest-circle-back',
      renames: [
        {
          filePath: './src/app/test/test.scss',
          construct: 'file',
          newFilenameInput: 'foo.component',
        },
        {
          filePath:
            './src/app/test-suffix.component/test-suffix.component.spec.ts',
          construct: 'component',
          newFilenameInput: 'baa',
        },
        // now rename back to original
        {
          filePath: './src/app/foo/foo.component.scss',
          construct: 'component',
          newFilenameInput: 'test',
        },
        {
          filePath: './src/app/baa/baa.spec.ts',
          construct: 'file',
          newFilenameInput: 'test-suffix.component',
        },
      ],
      fileDiffPath:
        './src/test/suite/diffs/ng20-latest-full-circle-non-ng20.txt',
      useNg20Convention: false,
    });
  });
});
