import { runMochaScenarioFile } from './helpers/run-mocha-scenario-file.function';

export function run(): Promise<void> {
  return runMochaScenarioFile('./suite/scenario6-windows.test.js');
}
