export interface TestScenarioConfig {
  name: string;
  projectPaths: {
    mac: string;
    windows: string;
  };
  renames: Array<{
    filePath: string;
    construct: 'file' | 'component' | 'service' | 'directive' | 'module';
    newFilenameInput: string;
  }>;
  tests: {
    fileDiffPath: string;
    useNg20Convention: boolean;
    projectUsesStandaloneComponentsOnly: boolean;
  }[];
}

// Platform-specific project paths

// Test scenario configurations
export const SCENARIO_CONFIGS: Record<string, TestScenarioConfig[]> = {
  '1': [
    {
      name: 'Scenario 1',
      projectPaths: {
        mac: '/Users/tom/Development/vscode-ext/_rename-test-spas/simple-reactive-viewmodel-example',
        windows: 'C:\\Development\\my-stuff\\simple-reactive-viewmodel-example',
      },
      renames: [
        {
          filePath:
            './src/app/shared/book-ui/book-list/book-list.component.html',
          construct: 'file',
          newFilenameInput: 'tom-test',
        },
      ],
      tests: [
        {
          fileDiffPath:
            './src/test/suite/diffs/simple-reactive-viewmodel-example.txt',
          useNg20Convention: true,
          projectUsesStandaloneComponentsOnly: false,
        },
        {
          fileDiffPath:
            './src/test/suite/diffs/simple-reactive-viewmodel-example-non-ng20.txt',
          useNg20Convention: false,
          projectUsesStandaloneComponentsOnly: false,
        },
      ],
    },
  ],
  '2': [
    {
      name: 'Scenario 2',
      projectPaths: {
        mac: '/Users/tom/Development/vscode-ext/_rename-test-spas/shp-wild-paths',
        windows: 'C:\\Development\\my-stuff\\shp-wild-paths',
      },
      renames: [
        {
          filePath:
            './apps/Shop/src/app/registration/registration.component.scss',
          construct: 'component',
          newFilenameInput: 'tom-test.component',
        },
      ],
      tests: [
        {
          fileDiffPath: './src/test/suite/diffs/shp-wild-paths.txt',
          useNg20Convention: false,
          projectUsesStandaloneComponentsOnly: false,
        },
      ],
    },
  ],
  '3': [
    {
      name: 'Scenario 3',
      projectPaths: {
        mac: '/Users/tom/Development/vscode-ext/_rename-test-spas/dsls-spa',
        windows: 'C:\\Development\\my-stuff\\dsls-spa',
      },
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
      tests: [
        {
          fileDiffPath: './src/test/suite/diffs/dsls-spa.txt',
          useNg20Convention: false,
          projectUsesStandaloneComponentsOnly: false,
        },
      ],
    },
  ],
  '4': [
    {
      name: 'Scenario 4',
      projectPaths: {
        mac: '/Users/tom/Development/vscode-ext/_rename-test-spas/test-paths-app',
        windows: 'C:\\Development\\my-stuff\\test-paths-app',
      },
      renames: [
        {
          filePath:
            './projects/my-service-lib/src/lib/my-service-lib.service.ts',
          construct: 'service',
          newFilenameInput: 'tom-test.service',
        },
      ],
      tests: [
        {
          fileDiffPath: './src/test/suite/diffs/test-paths-app.txt',
          useNg20Convention: true,
          projectUsesStandaloneComponentsOnly: false,
        },
        {
          fileDiffPath: './src/test/suite/diffs/test-paths-app-non-ng20.txt',
          useNg20Convention: false,
          projectUsesStandaloneComponentsOnly: false,
        },
      ],
    },
  ],
  '5': [
    {
      name: 'Scenario 5',
      projectPaths: {
        mac: '/Users/tom/Development/vscode-ext/_rename-test-spas/test-rename-spa',
        windows: 'C:\\Development\\my-stuff\\test-rename-spa',
      },
      renames: [
        {
          filePath: './src/app/products/products.component.spec.ts',
          construct: 'component',
          newFilenameInput: 'tom-test.component',
        },
        {
          filePath:
            './projects/shared/src/lib/multiply-by-ten/multiply-by-ten.directive.ts',
          construct: 'directive',
          newFilenameInput: 'dir-prop.directive',
        },
        {
          filePath:
            './projects/shared/src/lib/multiply-by-twenty/multiply-by-twenty.directive.spec.ts',
          construct: 'directive',
          newFilenameInput: 'dir-identifier.directive',
        },
        {
          filePath: './src/app/tom-test.component/products.module.ts',
          construct: 'module',
          newFilenameInput: 'tom-test.module',
        },
        {
          filePath: './src/app/tom-test.component/product.pipe.ts',
          construct: 'file',
          newFilenameInput: 'formatter',
        },
      ],
      tests: [
        {
          fileDiffPath: './src/test/suite/diffs/test-rename-spa-ng20.txt',
          useNg20Convention: true,
          projectUsesStandaloneComponentsOnly: false,
        },
      ],
    },
    {
      name: 'Scenario 5',
      projectPaths: {
        mac: '/Users/tom/Development/vscode-ext/_rename-test-spas/test-rename-spa',
        windows: 'C:\\Development\\my-stuff\\test-rename-spa',
      },
      renames: [
        {
          filePath: './src/app/products/products.component.spec.ts',
          construct: 'component',
          newFilenameInput: 'tom-test.component',
        },
        {
          filePath:
            './projects/shared/src/lib/multiply-by-ten/multiply-by-ten.directive.ts',
          construct: 'directive',
          newFilenameInput: 'dir-prop.directive',
        },
        {
          filePath:
            './projects/shared/src/lib/multiply-by-twenty/multiply-by-twenty.directive.spec.ts',
          construct: 'directive',
          newFilenameInput: 'dir-identifier.directive',
        },
        {
          filePath: './src/app/tom-test/products.module.ts',
          construct: 'module',
          newFilenameInput: 'tom-test.module',
        },
        {
          filePath: './src/app/tom-test/product.pipe.ts',
          construct: 'file',
          newFilenameInput: 'formatter',
        },
      ],
      tests: [
        {
          fileDiffPath: './src/test/suite/diffs/test-rename-spa-non-ng20.txt',
          useNg20Convention: false,
          projectUsesStandaloneComponentsOnly: false,
        },
      ],
    },
  ],
  '6': [
    {
      name: 'Scenario 6',
      projectPaths: {
        mac: '/Users/tom/Development/vscode-ext/_rename-test-spas/test-ng17-css',
        windows: 'C:\\Development\\my-stuff\\test-ng17-css',
      },
      renames: [
        {
          filePath: './src/app/app.component.css',
          construct: 'component',
          newFilenameInput: 'tom-test.component',
        },
      ],
      tests: [
        {
          fileDiffPath:
            './src/test/suite/diffs/test-styleurl-and-jasminespy-app.txt',
          useNg20Convention: false,
          projectUsesStandaloneComponentsOnly: false,
        },
      ],
    },
  ],
  '7': [
    {
      name: 'Scenario 7',
      projectPaths: {
        mac: '/Users/tom/Development/vscode-ext/_rename-test-spas/ng20',
        windows: 'C:\\Development\\my-stuff\\test-renamer-with-ng20',
      },
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
      tests: [
        {
          fileDiffPath: './src/test/suite/diffs/ng20-all-new-features.txt',
          useNg20Convention: true,
          projectUsesStandaloneComponentsOnly: true,
        },
        {
          fileDiffPath:
            './src/test/suite/diffs/ng20-all-new-features-non-ng20.txt',
          useNg20Convention: false,
          projectUsesStandaloneComponentsOnly: true,
        },
      ],
    },
  ],
  '8': [
    {
      name: 'Scenario 8 half circle',
      projectPaths: {
        mac: '/Users/tom/Development/vscode-ext/_rename-test-spas/ng20-latest-circle-back',
        windows: 'C:\\Development\\my-stuff\\ng20-latest-circle-back',
      },
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
      tests: [
        {
          fileDiffPath: './src/test/suite/diffs/ng20-latest-half-circle.txt',
          useNg20Convention: true,
          projectUsesStandaloneComponentsOnly: true,
        },
        {
          fileDiffPath:
            './src/test/suite/diffs/ng20-latest-half-circle-non-ng20.txt',
          useNg20Convention: false,
          projectUsesStandaloneComponentsOnly: true,
        },
      ],
    },
    {
      name: 'Scenario 8 full circle ng20',
      projectPaths: {
        mac: '/Users/tom/Development/vscode-ext/_rename-test-spas/ng20-latest-circle-back',
        windows: 'C:\\Development\\my-stuff\\ng20-latest-circle-back',
      },
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
      tests: [
        {
          fileDiffPath: './src/test/suite/diffs/ng20-latest-full-circle.txt',
          useNg20Convention: true,
          projectUsesStandaloneComponentsOnly: true,
        },
      ],
    },
    {
      name: 'Scenario 8 full circle non-ng20',
      projectPaths: {
        mac: '/Users/tom/Development/vscode-ext/_rename-test-spas/ng20-latest-circle-back',
        windows: 'C:\\Development\\my-stuff\\ng20-latest-circle-back',
      },
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
      tests: [
        {
          fileDiffPath:
            './src/test/suite/diffs/ng20-latest-full-circle-non-ng20.txt',
          useNg20Convention: false,
          projectUsesStandaloneComponentsOnly: true,
        },
      ],
    },
  ],
};

// // Helper function to get scenario config
export function getScenarioConfig(scenarioKey: string): TestScenarioConfig[] {
  const config = SCENARIO_CONFIGS[scenarioKey];
  if (!config) {
    throw new Error(`Unknown scenario key: ${scenarioKey}`);
  }
  return config;
}

export function getProjectPath(config: TestScenarioConfig): string {
  const platform = process.platform === 'darwin' ? 'mac' : 'windows';
  return config.projectPaths[platform];
}
