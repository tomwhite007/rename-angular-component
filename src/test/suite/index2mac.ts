import { runMochaScenarioFile } from './helpers/run-mocha-scenario-file.function';

export function run(): Promise<void> {
  return runMochaScenarioFile('./suite/scenario2-mac.test.js');
}
