import { runMochaScenarioFile } from './helpers/run-mocha-scenario-file.function';

const scenarioPaths: Record<string, string> = {
  runScenario1Mac: './suite/scenario1-mac.test.js',
  runScenario1Windows: './suite/scenario1-windows.test.js',
  runScenario2Mac: './suite/scenario2-mac.test.js',
  runScenario2Windows: './suite/scenario2-windows.test.js',
  runScenario3Mac: './suite/scenario3-mac.test.js',
  runScenario3Windows: './suite/scenario3-windows.test.js',
  runScenario4Mac: './suite/scenario4-mac.test.js',
  runScenario4Windows: './suite/scenario4-windows.test.js',
  runScenario5Mac: './suite/scenario5-mac.test.js',
  runScenario5Windows: './suite/scenario5-windows.test.js',
  runScenario6Mac: './suite/scenario6-mac.test.js',
  runScenario6Windows: './suite/scenario6-windows.test.js',
  runScenario7Mac: './suite/scenario7-mac.test.js',
  runScenario7Windows: './suite/scenario7-windows.test.js',
  runScenario8Mac: './suite/scenario8-mac.test.js',
  runScenario8Windows: './suite/scenario8-windows.test.js',
};

export function run(): Promise<void> {
  const scenario = process.env.TEST_SCENARIO ?? 'runScenario1Mac';
  return runMochaScenarioFile(scenarioPaths[scenario]);
}
