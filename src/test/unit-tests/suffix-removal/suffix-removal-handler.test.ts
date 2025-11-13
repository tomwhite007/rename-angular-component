import { afterEach, beforeEach, describe, it } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { UserMessage } from '../../../rename-angular-component/logging/user-message.class';
import { SuffixRemovalHandler } from '../../../rename-angular-component/suffix-removal/suffix-removal-handler';
import AngularFileSuffixRemover, * as removeAngularSuffixesModule from '../../../rename-angular-component/suffix-removal/tools/remove-angular-suffixes';

const expect = require('chai').expect;

describe('SuffixRemovalHandler', () => {
  let sandbox: sinon.SinonSandbox;
  let mockUserMessage: UserMessage;
  let handler: SuffixRemovalHandler;
  let mockWorkspaceFolder: vscode.WorkspaceFolder;
  let mockShowQuickPick: sinon.SinonStub;
  let mockShowInputBox: sinon.SinonStub;
  let mockShowErrorMessage: sinon.SinonStub;
  let mockShowInformationMessage: sinon.SinonStub;
  let mockWithProgress: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    mockUserMessage = {
      logInfoToChannel: sandbox.stub(),
    } as any;

    mockWorkspaceFolder = {
      uri: vscode.Uri.file('/mock/workspace/path'),
      name: 'test-workspace',
      index: 0,
    };

    // Mock individual vscode.window methods
    mockShowQuickPick = sandbox.stub(vscode.window, 'showQuickPick');
    mockShowInputBox = sandbox.stub(vscode.window, 'showInputBox');
    mockShowErrorMessage = sandbox.stub(vscode.window, 'showErrorMessage');
    mockShowInformationMessage = sandbox.stub(
      vscode.window,
      'showInformationMessage'
    );
    mockWithProgress = sandbox.stub(vscode.window, 'withProgress');

    // Mock vscode.workspace
    sandbox
      .stub(vscode.workspace, 'workspaceFolders')
      .value([mockWorkspaceFolder]);

    handler = new SuffixRemovalHandler(
      mockUserMessage,
      {} as vscode.ExtensionContext
    );
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('execute', () => {
    it('should show error when no workspace folder found', async () => {
      sandbox.restore();
      sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined);
      mockShowErrorMessage = sandbox.stub(vscode.window, 'showErrorMessage');

      await handler.execute();

      expect(mockShowErrorMessage.calledWith('No workspace folder found')).to.be
        .true;
    });

    it('should return early when user cancels suffix selection', async () => {
      mockShowQuickPick.onFirstCall().resolves(undefined);

      await handler.execute();

      expect(mockShowQuickPick.calledTwice).to.be.false;
      expect(mockShowInputBox.called).to.be.false;
    });

    it('should return early when user cancels dry run selection', async () => {
      mockShowQuickPick.onFirstCall().resolves({ value: 'component' });
      mockShowQuickPick.onSecondCall().resolves(undefined);

      await handler.execute();

      expect(mockShowInputBox.called).to.be.false;
    });

    it('should return early when user cancels exclusion input', async () => {
      mockShowQuickPick.onFirstCall().resolves({ value: 'component' });
      mockShowQuickPick.onSecondCall().resolves({ value: false });
      mockShowInputBox.resolves(undefined);

      await handler.execute();

      expect(mockWithProgress.called).to.be.false;
    });

    it.skip('should process with empty exclusion prefixes', async () => {
      mockShowQuickPick.onFirstCall().resolves({ value: 'component' });
      mockShowQuickPick.onSecondCall().resolves({ value: false });
      mockShowInputBox.resolves('');
      mockWithProgress.callsFake((options: any, callback: any) =>
        callback({
          report: sandbox.stub(),
        })
      );

      // Mock the renamer execution
      const mockExecute = sandbox.stub().resolves();
      const mockConstructor = sandbox.stub().returns({
        execute: mockExecute,
      }) as unknown as typeof AngularFileSuffixRemover;
      sandbox.replace(removeAngularSuffixesModule, 'default', mockConstructor);

      await handler.execute();

      expect(mockExecute.called).to.be.true;
    });

    it.skip('should parse exclusion prefixes correctly', async () => {
      mockShowQuickPick.onFirstCall().resolves({ value: 'component' });
      mockShowQuickPick.onSecondCall().resolves({ value: false });
      mockShowInputBox.resolves('profile.component, user.service');
      mockWithProgress.callsFake((options: any, callback: any) =>
        callback({
          report: sandbox.stub(),
        })
      );

      // Mock the renamer execution
      const mockExecute = sandbox.stub().resolves();
      const mockConstructor = sandbox.stub().returns({ execute: mockExecute });
      const removeAngularSuffixesModule = require('../../../rename-angular-component/suffix-removal/tools/remove-angular-suffixes');
      sandbox.replace(removeAngularSuffixesModule, 'default', mockConstructor);

      await handler.execute();

      expect(
        mockConstructor.calledWith('component', false, sinon.match.any, [
          'profile.component',
          'user.service',
        ])
      ).to.be.true;
    });

    it.skip('should handle validation errors in exclusion input', async () => {
      mockShowQuickPick.onFirstCall().resolves({ value: 'component' });
      mockShowQuickPick.onSecondCall().resolves({ value: false });
      mockShowInputBox.resolves('invalid@pattern');
      mockWithProgress.callsFake((options: any, callback: any) =>
        callback({
          report: sandbox.stub(),
        })
      );

      // Mock the renamer execution
      const mockExecute = sandbox.stub().resolves();
      const mockConstructor = sandbox.stub().returns({ execute: mockExecute });
      const removeAngularSuffixesModule = require('../../../rename-angular-component/suffix-removal/tools/remove-angular-suffixes');
      sandbox.replace(removeAngularSuffixesModule, 'default', mockConstructor);

      await handler.execute();

      // The validation error should be handled by the input box, but the process continues
      expect(mockWithProgress.called).to.be.true;
    });

    it.skip('should process "all" suffix type', async () => {
      mockShowQuickPick.onFirstCall().resolves({ value: 'all' });
      mockShowQuickPick.onSecondCall().resolves({ value: false });
      mockShowInputBox.resolves('');
      mockWithProgress.callsFake((options: any, callback: any) =>
        callback({
          report: sandbox.stub(),
        })
      );

      // Mock the renameAllAngularFiles function
      const mockRenameAll = sandbox.stub().resolves();
      const removeAngularSuffixesModule = require('../../../rename-angular-component/suffix-removal/tools/remove-angular-suffixes');
      sandbox.replace(
        removeAngularSuffixesModule,
        'renameAllAngularFiles',
        mockRenameAll
      );

      await handler.execute();

      expect(mockRenameAll.calledWith(false, mockUserMessage, [])).to.be.true;
    });

    it('should handle errors during execution', async () => {
      mockShowQuickPick.onFirstCall().resolves({ value: 'component' });
      mockShowQuickPick.onSecondCall().resolves({ value: false });
      mockShowInputBox.resolves('');
      mockWithProgress.throws(new Error('Test error'));

      await handler.execute();

      expect(mockShowErrorMessage.called).to.be.true;
      expect((mockUserMessage.logInfoToChannel as sinon.SinonStub).called).to.be
        .true;
    });
  });

  describe('Input validation', () => {
    it.skip('should validate exclusion patterns correctly', async () => {
      mockShowQuickPick.onFirstCall().resolves({ value: 'component' });
      mockShowQuickPick.onSecondCall().resolves({ value: false });
      mockShowInputBox.resolves('');

      await handler.execute();

      const validateInput = mockShowInputBox.getCall(0).args[0].validateInput;

      // Valid patterns
      expect(validateInput('profile.component, user.service')).to.be.null;
      expect(validateInput('profile.component')).to.be.null;
      expect(validateInput('profile, user')).to.be.null;
      expect(validateInput('profile-component, user_service')).to.be.null;

      // Invalid patterns
      expect(validateInput('invalid@pattern')).to.not.be.null;
      expect(validateInput('profile.component, invalid@pattern')).to.not.be
        .null;
      expect(validateInput('profile.component, ')).to.not.be.null;
    });

    it('should accept empty exclusion input', async () => {
      mockShowQuickPick.onFirstCall().resolves({ value: 'component' });
      mockShowQuickPick.onSecondCall().resolves({ value: false });
      mockShowInputBox.resolves('');

      await handler.execute();

      const validateInput = mockShowInputBox.getCall(0).args[0].validateInput;

      expect(validateInput('')).to.be.null;
      expect(validateInput('   ')).to.be.null;
    });
  });

  describe('Quick pick options', () => {
    it('should provide correct suffix options', async () => {
      mockShowQuickPick.onFirstCall().resolves({ value: 'component' });
      mockShowQuickPick.onSecondCall().resolves({ value: false });
      mockShowInputBox.resolves('');

      await handler.execute();

      const quickPickOptions = mockShowQuickPick.getCall(0).args[0];

      expect(quickPickOptions).to.be.an('array');
      expect(quickPickOptions.length).to.equal(9); // 8 file types + 'all' option

      const allOption = quickPickOptions.find(
        (option: any) => option.value === 'all'
      );
      expect(allOption).to.not.be.undefined;
      expect(allOption.label).to.equal('All Angular file types');

      const componentOption = quickPickOptions.find(
        (option: any) => option.value === 'component'
      );
      expect(componentOption).to.not.be.undefined;
      expect(componentOption.label).to.equal('Component');
    });

    it('should provide correct dry run options', async () => {
      mockShowQuickPick.onFirstCall().resolves({ value: 'component' });
      mockShowQuickPick.onSecondCall().resolves({ value: false });
      mockShowInputBox.resolves('');

      await handler.execute();

      const dryRunOptions = mockShowQuickPick.getCall(1).args[0];

      expect(dryRunOptions).to.be.an('array');
      expect(dryRunOptions.length).to.equal(2);

      const previewOption = dryRunOptions.find(
        (option: any) => option.value === true
      );
      expect(previewOption).to.not.be.undefined;
      expect(previewOption.label).to.equal('Preview changes (dry run)');

      const applyOption = dryRunOptions.find(
        (option: any) => option.value === false
      );
      expect(applyOption).to.not.be.undefined;
      expect(applyOption.label).to.equal('Apply changes');
    });
  });
});
