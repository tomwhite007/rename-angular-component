import { runMochaScenarioFile } from './helpers/run-mocha-scenario-file.function';

export function run(): Promise<void> {
  return runMochaScenarioFile('./suite/scenario1.test.js');
}
