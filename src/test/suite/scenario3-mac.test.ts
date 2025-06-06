import vscode from 'vscode';
import { genericTestScenario } from './helpers/generic-test-scenario.function';

suite('Suite Scenario 3', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Scenario 3', async () => {
    /*
    This test scenario uses a private repo as the seed to base 3 renamer tests on.
    See src/test/suite/scenario1.test.ts and src/test/suite/scenario5.test.ts for publicly available test repos.
    */

    await genericTestScenario({
      projectRoot:
        '/Users/tom/Development/vscode-ext/_rename-test-spas/dsls-spa',
      renames: [
        {
          filePath:
            './libs/common/util-foundation/src/lib/services/build.config.service.ts',
          construct: 'file',
          newFilenameInput: 'conf-test.service',
        },
        {
          filePath:
            './libs/shared/ui-base-components/src/lib/banner/banner.component.spec.ts',
          construct: 'file',
          newFilenameInput: 'banner-test.component',
        },
        {
          filePath:
            './libs/shared/ui-dynamic-form-builder/src/lib/_shared/directives/tooltip/tooltip.directive.ts',
          construct: 'file',
          newFilenameInput: 'tooltip-test.directive',
        },
      ],
      fileDiffPath: './src/test/suite/diffs/dsls-spa.txt',
    });
  });
});
