import path = require('path');
import * as Mocha from 'mocha';

export function runMochaScenarioFile(scenarioFile: string): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 0,
    reporterOptions: {
      maxDiffSize: 200000,
    },
  });

  const testsRoot = path.resolve(__dirname, '../../');

  return new Promise<void>((c, e) => {
    mocha.addFile(path.resolve(testsRoot, scenarioFile));

    try {
      // Run the mocha test
      mocha.run((failures) => {
        if (failures > 0) {
          e(new Error(`${failures} tests failed.`));
        } else {
          c();
        }
      });
    } catch (err) {
      console.error(err);
      e(err);
    }
  });
}
