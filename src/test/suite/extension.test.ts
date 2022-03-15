import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { ReferenceIndexBuilder } from '../../move-ts-indexer/reference-index-builder';
import { EXTENSION_NAME } from '../../rename-angular-component/definitions/extension-name';
import { DebugLogger } from '../../rename-angular-component/logging/debug-logger.class';
import { UserMessage } from '../../rename-angular-component/logging/user-message.class';
import { Renamer } from '../../rename-angular-component/renamer.class';
import simpleGit, { DiffResult, SimpleGitOptions } from 'simple-git';
import path = require('path');
import { cwd } from 'process';
import * as fs from 'fs-extra-promise';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');
  // this.timeout(0);

  test('Sample test', async (done) => {
    const debugLogger = new DebugLogger(false);
    const userMessage = new UserMessage(EXTENSION_NAME);
    const indexer: ReferenceIndexBuilder = new ReferenceIndexBuilder(
      debugLogger
    );

    const initWithProgress = () => {
      return vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `${EXTENSION_NAME} is indexing`,
        },
        async (progress) => {
          return indexer.init(progress);
        }
      );
    };
    await initWithProgress();

    const renamer = new Renamer(
      indexer,
      Promise.resolve(),
      userMessage,
      debugLogger,
      'tom-test'
    );

    await renamer.rename(
      'component',
      vscode.Uri.file(
        '/Users/tom/Development/my-stuff/simple-reactive-viewmodel-example/src/app/shared/book-ui/book-list/book-list.component.html'
      )
    );

    const options: Partial<SimpleGitOptions> = {
      baseDir:
        '/Users/tom/Development/my-stuff/simple-reactive-viewmodel-example/',
    };

    const git = simpleGit(options);

    const diff = await git.diff();

    const extensionDevelopmentPath = path.resolve(__dirname, '../../../');

    // console.log(path.join(__dirname, './diffs/'));

    // await fs.mkdir(path.join(__dirname, './diffs/'));

    await fs.writeFileAsync(
      path.join(
        extensionDevelopmentPath,
        './src/test/suite/diffs/simple-reactive-viewmodel-example.txt'
      ),
      diff,
      'utf-8'
    );

    console.log(diff);

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
