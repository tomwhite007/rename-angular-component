const expect = require('chai').expect;
import { afterEach, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';
import vscode from 'vscode';
import { FileItem } from '../../../move-ts-indexer/file-item';
import { ReferenceIndexBuilder } from '../../../move-ts-indexer/reference-index-builder';
import { FileMoveHandler } from '../../../rename-angular-component/file-manipulation/file-move-handler.class';
import { DebugLogger } from '../../../rename-angular-component/logging/debug-logger.class';
import { UserMessage } from '../../../rename-angular-component/logging/user-message.class';

describe('FileMoveHandler', () => {
  let sandbox: sinon.SinonSandbox;
  let fileMoveHandler: FileMoveHandler;
  let indexer: ReferenceIndexBuilder;
  let userMessage: UserMessage;
  let debugLogger: DebugLogger;
  let progress: vscode.Progress<{ message?: string; increment?: number }> & {
    report: sinon.SinonStub;
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    debugLogger = new DebugLogger(false);
    indexer = new ReferenceIndexBuilder(debugLogger);
    userMessage = new UserMessage('test message');
    progress = {
      report: sandbox.stub(),
    };
    fileMoveHandler = new FileMoveHandler(indexer, userMessage);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('runFileMoveJobs', () => {
    it('should process file move jobs and update progress', async () => {
      const fileMoveJobs: (FileItem & { move: sinon.SinonStub })[] = [
        { move: sandbox.stub().resolves() } as unknown as FileItem & {
          move: sinon.SinonStub;
        },
        { move: sandbox.stub().resolves() } as unknown as FileItem & {
          move: sinon.SinonStub;
        },
      ];

      await fileMoveHandler.runFileMoveJobs(fileMoveJobs, progress);

      expect(progress.report.called).to.be.true;
      expect(fileMoveJobs[0].move.calledOnce).to.be.true;
      expect(fileMoveJobs[1].move.calledOnce).to.be.true;
    });

    it('should handle empty file move jobs array', async () => {
      const fileMoveJobs: FileItem[] = [];

      await fileMoveHandler.runFileMoveJobs(fileMoveJobs, progress);

      expect(progress.report.called).to.be.true;
    });
  });

  describe('logFileEditsToOutput', () => {
    it('should log file edits with correct paths', () => {
      const files = ['/path/to/source1.ts', '/path/to/source2.ts'];

      const logInfoToChannelStub = sandbox.stub(
        userMessage,
        'logInfoToChannel'
      );

      // Mock workspace.workspaceFolders
      const mockWorkspaceFolder = {
        uri: {
          fsPath: '/path',
        },
      };
      sandbox
        .stub(vscode.workspace, 'workspaceFolders')
        .value([mockWorkspaceFolder]);

      // @ts-ignore - accessing private method for testing
      fileMoveHandler.logFileEditsToOutput(files);

      expect(logInfoToChannelStub.calledOnce).to.be.true;
      const loggedFiles = logInfoToChannelStub.firstCall.args[0];

      expect(loggedFiles).to.deep.equal(['to/source1.ts', 'to/source2.ts']);
    });

    it('should handle workspace folders being undefined', () => {
      const files = ['/path/to/source1.ts', '/path/to/source2.ts'];

      const logInfoToChannelStub = sandbox.stub(
        userMessage,
        'logInfoToChannel'
      );

      // Mock workspace.workspaceFolders as undefined
      sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined);

      // @ts-ignore - accessing private method for testing
      fileMoveHandler.logFileEditsToOutput(files);

      expect(logInfoToChannelStub.calledOnce).to.be.true;
      const loggedFiles = logInfoToChannelStub.firstCall.args[0];

      // When workspace folders is undefined, the original paths should be logged
      expect(loggedFiles).to.deep.equal([
        '/path/to/source1.ts',
        '/path/to/source2.ts',
      ]);
    });

    it('should handle empty workspace folders array', () => {
      const files = ['/path/to/source1.ts', '/path/to/source2.ts'];

      const logInfoToChannelStub = sandbox.stub(
        userMessage,
        'logInfoToChannel'
      );

      // Mock workspace.workspaceFolders as empty array
      sandbox.stub(vscode.workspace, 'workspaceFolders').value([]);

      // @ts-ignore - accessing private method for testing
      fileMoveHandler.logFileEditsToOutput(files);

      expect(logInfoToChannelStub.calledOnce).to.be.true;
      const loggedFiles = logInfoToChannelStub.firstCall.args[0];

      // When workspace folders is empty, the original paths should be logged
      expect(loggedFiles).to.deep.equal([
        '/path/to/source1.ts',
        '/path/to/source2.ts',
      ]);
    });
  });
});
