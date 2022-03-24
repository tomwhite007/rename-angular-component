import * as vscode from 'vscode';
import { genericTestScenario } from './helpers/generic-test-scenario.function';

suite('Suite Scenario 3', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Scenario 3', async () => {
    await genericTestScenario({
      projectRoot:
        '/Users/tom/Development/vscode-ext/_rename-test-spas/dsls-spa',
      renames: [
        {
          filePath:
            './libs/common/util-foundation/src/lib/services/build.config.service.ts',
          construct: 'service',
          newStub: 'conf-test',
        },
        {
          filePath:
            './libs/shared/ui-base-components/src/lib/banner/banner.component.spec.ts',
          construct: 'component',
          newStub: 'banner-test',
        },
        {
          filePath:
            './libs/shared/ui-dynamic-form-builder/src/lib/_shared/directives/tooltip/tooltip.directive.ts',
          construct: 'directive',
          newStub: 'tooltip-test',
        },
      ],
      fileDiffPath: './src/test/suite/diffs/dsls-spa.txt',
    });
  });
});
