import { runMochaScenarioFile } from './helpers/run-mocha-scenario-file.function';

export function run(): Promise<void> {
  // Get the scenario from environment variable or default to scenario1
  const scenarioNumber = process.env.TEST_SCENARIO || '1';

  console.log(`Running test scenario ${scenarioNumber} on ${process.platform}`);

  // Run the unified scenario file
  return runMochaScenarioFile('./suite/scenario-unified.test.js');
}

// Allow running specific scenarios via command line
if (require.main === module) {
  const scenario = process.argv[2] || '1';
  process.env.TEST_SCENARIO = scenario;
  run().catch(console.error);
}
