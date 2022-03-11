import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { timeoutPause } from '../../utils/timeout-pause';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');
  // this.timeout(0);

  test('Sample test', async (done) => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));

    // await vscode.commands.executeCommand(
    //   'rename-angular-component.renameComponent'
    // );

    // await timeoutPause(2000);

    console.log('test');
    done();
  });
});
