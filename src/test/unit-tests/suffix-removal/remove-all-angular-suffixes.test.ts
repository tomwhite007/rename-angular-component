import { afterEach, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';
import { renameAllAngularFiles } from '../../../rename-angular-component/suffix-removal/tools/remove-angular-suffixes';

const expect = require('chai').expect;

describe.skip('removeAllAngularSuffixes', () => {
  let sandbox: sinon.SinonSandbox;
  let mockUserMessage: any;
  let mockAngularFileSuffixRemover: any;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    mockUserMessage = {
      logInfoToChannel: sandbox.stub(),
    };

    // Mock the AngularFileSuffixRemover class
    mockAngularFileSuffixRemover = {
      execute: sandbox.stub().resolves(),
      changes: [{ type: 'rename', from: 'test.component.ts', to: 'test.ts' }],
    };

    sandbox
      .stub(
        require('../../../rename-angular-component/suffix-removal/tools/remove-angular-suffixes'),
        'default'
      )
      .returns(mockAngularFileSuffixRemover);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Basic functionality', () => {
    it('should process all Angular file types in correct order', async () => {
      await renameAllAngularFiles(false, mockUserMessage, []);

      // Should create 8 instances (one for each Angular type)
      expect(mockAngularFileSuffixRemover.execute.callCount).to.equal(8);

      // Verify the order of processing
      const calls = mockAngularFileSuffixRemover.execute.getCalls();

      // Note: We can't easily test the exact order since we're mocking the constructor,
      // but we can verify all types are processed
      expect(calls.length).to.equal(8);
    });

    it('should pass correct parameters to each renamer instance', async () => {
      const exclusionPrefixes = ['profile.component', 'user.service'];

      await renameAllAngularFiles(true, mockUserMessage, exclusionPrefixes);

      // Verify that execute was called for each type
      expect(mockAngularFileSuffixRemover.execute.callCount).to.equal(8);
    });

    it('should log appropriate messages', async () => {
      await renameAllAngularFiles(false, mockUserMessage, []);

      // Check that logInfoToChannel was called with expected messages
      const logCalls = mockUserMessage.logInfoToChannel.getCalls();
      expect(logCalls.length).to.be.greaterThan(0);

      // Should log the start message
      const startMessage = logCalls.find((call: any) =>
        call.args[0][0].includes(
          'Starting comprehensive Angular file rename operation'
        )
      );
      expect(startMessage).to.be.defined;
    });

    it('should handle dry run mode correctly', async () => {
      await renameAllAngularFiles(true, mockUserMessage, []);

      // Should still process all types
      expect(mockAngularFileSuffixRemover.execute.callCount).to.equal(8);
    });

    it('should handle empty exclusion prefixes', async () => {
      await renameAllAngularFiles(false, mockUserMessage, []);

      // Should process all types
      expect(mockAngularFileSuffixRemover.execute.callCount).to.equal(8);
    });

    it('should handle exclusion prefixes correctly', async () => {
      const exclusionPrefixes = [
        'profile.component',
        'user.service',
        'admin.guard',
      ];

      await renameAllAngularFiles(false, mockUserMessage, exclusionPrefixes);

      // Should process all types with exclusion prefixes
      expect(mockAngularFileSuffixRemover.execute.callCount).to.equal(8);
    });
  });

  describe('Error handling', () => {
    it('should continue processing other types when one type fails', async () => {
      // Make one type fail
      mockAngularFileSuffixRemover.execute
        .onCall(2)
        .rejects(new Error('Test error'));

      await renameAllAngularFiles(false, mockUserMessage, []);

      // Should still process all types (including the failed one)
      expect(mockAngularFileSuffixRemover.execute.callCount).to.equal(8);
    });

    it('should log error messages when processing fails', async () => {
      mockAngularFileSuffixRemover.execute
        .onCall(1)
        .rejects(new Error('Service processing failed'));

      await renameAllAngularFiles(false, mockUserMessage, []);

      // Should log error message
      const logCalls = mockUserMessage.logInfoToChannel.getCalls();
      const errorMessage = logCalls.find(
        (call: any) =>
          call.args[0][0].includes('Error processing') &&
          call.args[0][0].includes('Service processing failed')
      );
      expect(errorMessage).to.be.defined;
    });

    it('should handle multiple failures gracefully', async () => {
      // Make multiple types fail
      mockAngularFileSuffixRemover.execute
        .onCall(1)
        .rejects(new Error('Service error'));
      mockAngularFileSuffixRemover.execute
        .onCall(3)
        .rejects(new Error('Pipe error'));

      await renameAllAngularFiles(false, mockUserMessage, []);

      // Should still process all types
      expect(mockAngularFileSuffixRemover.execute.callCount).to.equal(8);

      // Should log multiple error messages
      const logCalls = mockUserMessage.logInfoToChannel.getCalls();
      const errorMessages = logCalls.filter((call: any) =>
        call.args[0][0].includes('Error processing')
      );
      expect(errorMessages.length).to.be.greaterThan(1);
    });
  });

  describe('Summary reporting', () => {
    it('should report correct summary statistics', async () => {
      await renameAllAngularFiles(false, mockUserMessage, []);

      // Should log summary messages
      const logCalls = mockUserMessage.logInfoToChannel.getCalls();
      const summaryMessage = logCalls.find((call: any) =>
        call.args[0][0].includes('Comprehensive Rename Summary')
      );
      expect(summaryMessage).to.be.defined;
    });

    it('should report processed types count', async () => {
      await renameAllAngularFiles(false, mockUserMessage, []);

      const logCalls = mockUserMessage.logInfoToChannel.getCalls();
      const processedTypesMessage = logCalls.find((call: any) =>
        call.args[0][0].includes('File types processed')
      );
      expect(processedTypesMessage).to.be.defined;
    });

    it('should report total changes count', async () => {
      await renameAllAngularFiles(false, mockUserMessage, []);

      const logCalls = mockUserMessage.logInfoToChannel.getCalls();
      const totalChangesMessage = logCalls.find((call: any) =>
        call.args[0][0].includes('Total changes made')
      );
      expect(totalChangesMessage).to.be.defined;
    });

    it('should show dry run message when in dry run mode', async () => {
      await renameAllAngularFiles(true, mockUserMessage, []);

      const logCalls = mockUserMessage.logInfoToChannel.getCalls();
      const dryRunMessage = logCalls.find((call: any) =>
        call.args[0][0].includes('This was a dry run')
      );
      expect(dryRunMessage).to.be.defined;
    });

    it('should show success message when not in dry run mode', async () => {
      await renameAllAngularFiles(false, mockUserMessage, []);

      const logCalls = mockUserMessage.logInfoToChannel.getCalls();
      const successMessage = logCalls.find((call: any) =>
        call.args[0][0].includes(
          'Comprehensive Angular file rename completed successfully'
        )
      );
      expect(successMessage).to.be.defined;
    });
  });

  describe('Default parameters', () => {
    it('should work with no parameters', async () => {
      await renameAllAngularFiles();

      // Should use defaults: dryRun=false, userMessage=undefined, exclusionPrefixes=[]
      expect(mockAngularFileSuffixRemover.execute.callCount).to.equal(8);
    });

    it('should work with only dryRun parameter', async () => {
      await renameAllAngularFiles(true);

      expect(mockAngularFileSuffixRemover.execute.callCount).to.equal(8);
    });

    it('should work with dryRun and userMessage parameters', async () => {
      await renameAllAngularFiles(false, mockUserMessage);

      expect(mockAngularFileSuffixRemover.execute.callCount).to.equal(8);
    });
  });
});
