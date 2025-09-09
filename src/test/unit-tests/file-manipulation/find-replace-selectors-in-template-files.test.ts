const expect = require('chai').expect;
import fs from 'fs-extra-promise';
import { afterEach, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';
import vscode from 'vscode';
import { findReplaceSelectorsInTemplateFiles } from '../../../rename-angular-component/file-manipulation/find-replace-selectors-in-template-files.function';
import { DebugLogger } from '../../../rename-angular-component/logging/debug-logger.class';
import { UserMessage } from '../../../rename-angular-component/logging/user-message.class';

describe('findReplaceSelectorsInTemplateFiles', () => {
  let sandbox: sinon.SinonSandbox;
  let userMessage: UserMessage;
  let workspaceFindFilesStub: sinon.SinonStub;
  let readFileAsyncStub: sinon.SinonStub;
  let writeFileAsyncStub: sinon.SinonStub;
  let debugLogger: DebugLogger;
  const coreFilePath = 'src/app/test/test.component.ts';

  beforeEach(() => {
    debugLogger = new DebugLogger(false);
    sandbox = sinon.createSandbox();
    userMessage = new UserMessage('test message');
    workspaceFindFilesStub = sandbox.stub(vscode.workspace, 'findFiles');
    readFileAsyncStub = sandbox.stub(fs, 'readFileAsync');
    writeFileAsyncStub = sandbox.stub(fs, 'writeFileAsync');

    // Mock workspace.workspaceFolders for all tests
    const mockWorkspaceFolder = {
      uri: {
        fsPath: '/path',
      },
    };
    sandbox
      .stub(vscode.workspace, 'workspaceFolders')
      .value([mockWorkspaceFolder]);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should not process files when original and new selectors are the same', async () => {
    await findReplaceSelectorsInTemplateFiles(
      'same',
      'same',
      userMessage,
      'component',
      coreFilePath,
      [],
      debugLogger
    );
    expect(workspaceFindFilesStub.called).to.be.false;
  });

  it('should process template files and replace selectors', async () => {
    const mockUris = [
      { fsPath: '/path/to/file1.html' },
      { fsPath: '/path/to/file2.component.ts' },
    ];
    workspaceFindFilesStub.resolves(mockUris);
    readFileAsyncStub.resolves('<app-old-selector></app-old-selector>');
    writeFileAsyncStub.resolves();

    await findReplaceSelectorsInTemplateFiles(
      'app-old-selector',
      'app-new-selector',
      userMessage,
      'component',
      coreFilePath,
      ['/path/to/file1', '/path/to/file2.component'],
      debugLogger
    );

    expect(workspaceFindFilesStub.calledOnce).to.be.true;
    expect(readFileAsyncStub.callCount).to.equal(2);
    expect(writeFileAsyncStub.callCount).to.equal(2);
  });

  it('should exclude core file from processing', async () => {
    const mockUris = [
      { fsPath: '/path/to/file1.html' },
      { fsPath: '/path/to/file2.component.ts' },
      { fsPath: coreFilePath }, // Core file should be skipped
    ];
    workspaceFindFilesStub.resolves(mockUris);
    readFileAsyncStub.resolves('<app-old-selector></app-old-selector>');
    writeFileAsyncStub.resolves();

    await findReplaceSelectorsInTemplateFiles(
      'app-old-selector',
      'app-new-selector',
      userMessage,
      'component',
      coreFilePath,
      ['/path/to/file1', '/path/to/file2.component'],
      debugLogger
    );

    expect(workspaceFindFilesStub.calledOnce).to.be.true;
    expect(readFileAsyncStub.callCount).to.equal(2);
    expect(writeFileAsyncStub.callCount).to.equal(2);
  });

  it('should process template files and replace selectors and not change similar selectors', async () => {
    const mockUris = [{ fsPath: '/path/to/file1.html' }];
    workspaceFindFilesStub.resolves(mockUris);
    readFileAsyncStub.resolves(
      '<app-old-selector></app-old-selector> <app-old-selector-extra></app-old-selector-extra>'
    );
    writeFileAsyncStub.resolves();

    await findReplaceSelectorsInTemplateFiles(
      'app-old-selector',
      'app-new-selector',
      userMessage,
      'component',
      coreFilePath,
      ['/path/to/file1'],
      debugLogger
    );

    expect(workspaceFindFilesStub.calledOnce).to.be.true;
    expect(readFileAsyncStub.callCount).to.equal(1);
    expect(
      writeFileAsyncStub.calledOnceWith(
        '/path/to/file1.html',
        '<app-new-selector></app-new-selector> <app-old-selector-extra></app-old-selector-extra>',
        'utf-8'
      )
    ).to.be.true;
  });

  it('should handle workspace folders being undefined', async () => {
    // Override the workspace folders mock for this specific test
    sandbox.restore();
    sandbox = sinon.createSandbox();
    workspaceFindFilesStub = sandbox.stub(vscode.workspace, 'findFiles');
    readFileAsyncStub = sandbox.stub(fs, 'readFileAsync');
    writeFileAsyncStub = sandbox.stub(fs, 'writeFileAsync');

    // Mock workspace.workspaceFolders as undefined
    sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined);

    const mockUris = [{ fsPath: '/path/to/file1.html' }];
    workspaceFindFilesStub.resolves(mockUris);
    readFileAsyncStub.resolves('<app-old-selector></app-old-selector>');
    writeFileAsyncStub.resolves();

    await findReplaceSelectorsInTemplateFiles(
      'app-old-selector',
      'app-new-selector',
      userMessage,
      'component',
      coreFilePath,
      ['/path/to/file1'],
      debugLogger
    );

    expect(workspaceFindFilesStub.calledOnce).to.be.true;
    expect(readFileAsyncStub.callCount).to.equal(1);
    expect(writeFileAsyncStub.callCount).to.equal(1);
  });
});
