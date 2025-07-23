import { afterEach, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';
import vscode from 'vscode';
import { FileItem } from '../../../move-ts-indexer/file-item';
import { FileMoveHandler } from '../../../rename-angular-component/file-manipulation/file-move-handler.class';
import * as selectorUpdateHandler from '../../../rename-angular-component/file-manipulation/selector-update-handler.function';
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
  let mockUpdateSelectorsInTemplates: sinon.SinonStub;

  beforeEach(() => {
    // Create mock objects using sinon
    mockFileMoveHandler = sinon.createStubInstance(FileMoveHandler);
    mockFileMoveHandler.runFileMoveJobs.resolves();

    mockUserMessage = sinon.createStubInstance(UserMessage);
    mockUserMessage.logInfoToChannel.returns();
    mockUserMessage.popupMessage.returns();
    mockUserMessage.setOperationTitle.returns();

    mockUpdateSelectorsInTemplates = sinon
      .stub(selectorUpdateHandler, 'updateSelectorsInTemplates')
      .resolves();

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
      // Mock the prepareRenameDetails method
      const mockPrepareRenameDetails = sinon
        .stub(renamer as any, 'prepareRenameDetails')
        .resolves(true);

      // Mock the prepareFileMoveJobs method
      const mockPrepareFileMoveJobs = sinon
        .stub(renamer as any, 'prepareFileMoveJobs')
        .resolves(true);

      // Mock the context properties
      (renamer as any).context = {
        fileMoveJobs: [
          new FileItem(
            '/test/core/file/path/old.component.ts',
            '/test/core/file/path/test.component.ts',
            false,
            'old',
            'new'
          ),
          new FileItem(
            '/test/core/file/path/old-consumer.component.ts',
            '/test/core/file/path/old-consumer.component.ts',
            false,
            'old',
            'new'
          ),
        ],
        construct: 'component',
        selectorTransfer: new SelectorTransfer(),
        originalFileDetails: { path: '/test/core/file/path/old.component.ts' },
        title: 'Rename Angular Component',
        projectRoot: '/test/core',
        coreConstructNewFilePath: '/test/core/file/path/test.component.ts',
      };

      await renamer.rename('component', vscode.Uri.file('/test/path'));

      expect(
        mockPrepareRenameDetails.calledWith(
          'component',
          sinon.match.instanceOf(vscode.Uri)
        )
      ).to.be.true;
      expect(mockPrepareFileMoveJobs.called).to.be.true;
      expect(
        mockFileMoveHandler.runFileMoveJobs.calledWith(
          sinon.match.array,
          sinon.match.object
        )
      ).to.be.true;
      expect(mockUpdateSelectorsInTemplates.getCall(0).args[5]).to.deep.equal([
        '/test/core/file/path/test.component',
        '/test/core/file/path/old-consumer.component',
      ]);
      expect(mockWithProgress.called).to.be.true;
    });

    it('should handle errors during rename process', async () => {
      // Mock the prepareRenameDetails method
      const mockPrepareRenameDetails = sinon
        .stub(renamer as any, 'prepareRenameDetails')
        .resolves(true);

      // Mock the prepareFileMoveJobs method
      const mockPrepareFileMoveJobs = sinon
        .stub(renamer as any, 'prepareFileMoveJobs')
        .rejects(new Error('Test error'));

      // Mock the context properties
      (renamer as any).context = {
        fileMoveJobs: [new FileItem('source', 'target', false, 'old', 'new')],
        construct: 'component',
        selectorTransfer: new SelectorTransfer(),
        originalFileDetails: { path: '/test/path' },
        title: 'Rename Angular Component',
      };

      await renamer.rename('component', vscode.Uri.file('/test/path'));

      expect(
        mockPrepareRenameDetails.calledWith(
          'component',
          sinon.match.instanceOf(vscode.Uri)
        )
      ).to.be.true;
      expect(mockPrepareFileMoveJobs.called).to.be.true;

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

    it('should not proceed if prepareRenameDetails returns false', async () => {
      // Mock the prepareRenameDetails method to return false
      const mockPrepareRenameDetails = sinon
        .stub(renamer as any, 'prepareRenameDetails')
        .resolves(false);

      await renamer.rename('component', vscode.Uri.file('/test/path'));

      expect(mockPrepareRenameDetails.called).to.be.true;
      expect(mockFileMoveHandler.runFileMoveJobs.called).to.be.false;
    });

    it('should not proceed if prepareFileMoveJobs returns false', async () => {
      // Mock the prepareRenameDetails method to return true
      const mockPrepareRenameDetails = sinon
        .stub(renamer as any, 'prepareRenameDetails')
        .resolves(true);

      // Mock the prepareFileMoveJobs method to return false
      const mockPrepareFileMoveJobs = sinon
        .stub(renamer as any, 'prepareFileMoveJobs')
        .resolves(false);

      await renamer.rename('component', vscode.Uri.file('/test/path'));

      expect(mockPrepareRenameDetails.called).to.be.true;
      expect(mockPrepareFileMoveJobs.called).to.be.true;
      expect(mockFileMoveHandler.runFileMoveJobs.called).to.be.false;
    });
  });
});
