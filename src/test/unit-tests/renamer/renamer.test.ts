import { afterEach, beforeEach, describe, it } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { FileItem } from '../../../move-ts-indexer/file-item';
import { FileMoveHandler } from '../../../rename-angular-component/file-manipulation/file-move-handler.class';
import { SelectorTransfer } from '../../../rename-angular-component/in-file-edits/custom-edits';
import { DebugLogger } from '../../../rename-angular-component/logging/debug-logger.class';
import { UserMessage } from '../../../rename-angular-component/logging/user-message.class';
import { Renamer } from '../../../rename-angular-component/renamer.class';
const expect = require('chai').expect;

describe('Renamer', () => {
  let renamer: Renamer;
  let mockFileMoveHandler: sinon.SinonStubbedInstance<FileMoveHandler>;
  let mockUserMessage: sinon.SinonStubbedInstance<UserMessage>;
  let mockDebugLogger: sinon.SinonStubbedInstance<DebugLogger>;
  let mockIndexerInitialisePromise: Promise<number>;
  let mockWithProgress: sinon.SinonStub;

  beforeEach(() => {
    // Create mock objects using sinon
    mockFileMoveHandler = sinon.createStubInstance(FileMoveHandler);
    mockFileMoveHandler.runFileMoveJobs.resolves();

    mockUserMessage = sinon.createStubInstance(UserMessage);
    mockUserMessage.logInfoToChannel.returns();
    mockUserMessage.popupMessage.returns();
    mockUserMessage.setOperationTitle.returns();

    mockDebugLogger = sinon.createStubInstance(DebugLogger);
    mockDebugLogger.log.returns();
    mockDebugLogger.setWorkspaceRoot.returns();

    mockIndexerInitialisePromise = Promise.resolve(1);

    // Mock vscode.window.withProgress
    mockWithProgress = sinon.stub(vscode.window, 'withProgress').callsFake(
      (
        options: vscode.ProgressOptions,
        task: (
          progress: vscode.Progress<{
            message?: string;
            increment?: number;
          }>,
          token: vscode.CancellationToken
        ) => Thenable<any>
      ) =>
        task(
          {
            report: sinon.stub(),
          },
          new vscode.CancellationTokenSource().token
        )
    );

    renamer = new Renamer(
      mockIndexerInitialisePromise,
      mockUserMessage,
      mockDebugLogger,
      mockFileMoveHandler
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('rename', () => {
    it('should handle component rename successfully', async () => {
      // Mock the prepRenameDetails method
      const mockPrepRenameDetails = sinon
        .stub(renamer as any, 'prepRenameDetails')
        .resolves(true);

      // Mock the prepFileMoveJobs method
      const mockPrepFileMoveJobs = sinon
        .stub(renamer as any, 'prepFileMoveJobs')
        .resolves(true);

      // Mock the fileMoveJobs property
      (renamer as any).fileMoveJobs = [
        new FileItem('source', 'target', false, 'old', 'new'),
      ];
      (renamer as any).construct = 'component';
      (renamer as any).selectorTransfer = new SelectorTransfer();
      (renamer as any).originalFileDetails = { path: '/test/path' };
      (renamer as any).renameFolder = false;

      await renamer.rename('component', vscode.Uri.file('/test/path'));

      expect(
        mockPrepRenameDetails.calledWith(
          'component',
          sinon.match.instanceOf(vscode.Uri)
        )
      ).to.be.true;
      expect(mockPrepFileMoveJobs.called).to.be.true;
      expect(
        mockFileMoveHandler.runFileMoveJobs.calledWith(
          sinon.match.array,
          sinon.match.object
        )
      ).to.be.true;
      expect(mockWithProgress.called).to.be.true;
    });

    it('should handle errors during rename process', async () => {
      // Mock the prepRenameDetails method
      const mockPrepRenameDetails = sinon
        .stub(renamer as any, 'prepRenameDetails')
        .resolves(true);

      // Mock the prepFileMoveJobs method
      const mockPrepFileMoveJobs = sinon
        .stub(renamer as any, 'prepFileMoveJobs')
        .rejects(new Error('Test error'));

      // Mock the fileMoveJobs property
      (renamer as any).fileMoveJobs = [
        new FileItem('source', 'target', false, 'old', 'new'),
      ];
      (renamer as any).construct = 'component';
      (renamer as any).selectorTransfer = new SelectorTransfer();
      (renamer as any).originalFileDetails = { path: '/test/path' };
      (renamer as any).renameFolder = false;
      (renamer as any).title = 'Rename Angular Component';

      await renamer.rename('component', vscode.Uri.file('/test/path'));

      expect(
        mockPrepRenameDetails.calledWith(
          'component',
          sinon.match.instanceOf(vscode.Uri)
        )
      ).to.be.true;
      expect(mockPrepFileMoveJobs.called).to.be.true;

      expect(
        mockUserMessage.logInfoToChannel.calledWith(
          sinon.match.array.contains([
            'Sorry, an error occurred during the Rename Angular Component process',
            'We recommend reverting the changes made if there are any',
            "If it looks like a new issue, we'd appreciate you raising it here: https://github.com/tomwhite007/rename-angular-component/issues",
            "We're actively fixing any bugs reported.",
          ])
        )
      ).to.be.true;
    });

    it('should not proceed if prepRenameDetails returns false', async () => {
      // Mock the prepRenameDetails method to return false
      const mockPrepRenameDetails = sinon
        .stub(renamer as any, 'prepRenameDetails')
        .resolves(false);

      await renamer.rename('component', vscode.Uri.file('/test/path'));

      expect(mockPrepRenameDetails.called).to.be.true;
      expect(mockFileMoveHandler.runFileMoveJobs.called).to.be.false;
    });

    it('should not proceed if prepFileMoveJobs returns false', async () => {
      // Mock the prepRenameDetails method to return true
      const mockPrepRenameDetails = sinon
        .stub(renamer as any, 'prepRenameDetails')
        .resolves(true);

      // Mock the prepFileMoveJobs method to return false
      const mockPrepFileMoveJobs = sinon
        .stub(renamer as any, 'prepFileMoveJobs')
        .resolves(false);

      await renamer.rename('component', vscode.Uri.file('/test/path'));

      expect(mockPrepRenameDetails.called).to.be.true;
      expect(mockPrepFileMoveJobs.called).to.be.true;
      expect(mockFileMoveHandler.runFileMoveJobs.called).to.be.false;
    });
  });
});
