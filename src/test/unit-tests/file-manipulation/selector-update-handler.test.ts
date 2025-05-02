const expect = require('chai').expect;
import { afterEach, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';
import * as findReplaceSelectorsInTemplateFilesModule from '../../../rename-angular-component/file-manipulation/find-replace-selectors-in-template-files.function';
import { updateSelectorsInTemplates } from '../../../rename-angular-component/file-manipulation/selector-update-handler.function';
import { SelectorTransfer } from '../../../rename-angular-component/in-file-edits/custom-edits';
import { DebugLogger } from '../../../rename-angular-component/logging/debug-logger.class';
import { UserMessage } from '../../../rename-angular-component/logging/user-message.class';

describe('updateSelectorsInTemplates', () => {
  let sandbox: sinon.SinonSandbox;
  let userMessage: UserMessage;
  let debugLogger: DebugLogger;
  let findReplaceSelectorsInTemplateFilesStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    userMessage = new UserMessage('test message');
    debugLogger = new DebugLogger(false);
    findReplaceSelectorsInTemplateFilesStub = sandbox.stub();
    sandbox
      .stub(
        findReplaceSelectorsInTemplateFilesModule,
        'findReplaceSelectorsInTemplateFiles'
      )
      .callsFake(findReplaceSelectorsInTemplateFilesStub);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should update selectors for valid construct with different selectors', async () => {
    const selectorTransfer: SelectorTransfer = {
      oldSelector: 'app-old',
      newSelector: 'app-new',
    };

    await updateSelectorsInTemplates(
      'component',
      selectorTransfer,
      userMessage,
      debugLogger
    );

    expect(findReplaceSelectorsInTemplateFilesStub.calledOnce).to.be.true;
    expect(
      findReplaceSelectorsInTemplateFilesStub.firstCall.args
    ).to.deep.equal(['app-old', 'app-new', userMessage]);
  });

  it('should not update selectors when they are the same', async () => {
    const selectorTransfer: SelectorTransfer = {
      oldSelector: 'app-same',
      newSelector: 'app-same',
    };

    await updateSelectorsInTemplates(
      'component',
      selectorTransfer,
      userMessage,
      debugLogger
    );

    expect(findReplaceSelectorsInTemplateFilesStub.called).to.be.false;
  });

  it('should throw error when selector edit is not found', async () => {
    const selectorTransfer: SelectorTransfer = {
      oldSelector: undefined,
      newSelector: 'app-new',
    };

    try {
      await updateSelectorsInTemplates(
        'component',
        selectorTransfer,
        userMessage,
        debugLogger
      );
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).to.equal(
        "Selector edit not found. Couldn't amend selector."
      );
    }
  });

  it('should not process non-selector constructs', async () => {
    const selectorTransfer: SelectorTransfer = {
      oldSelector: 'app-old',
      newSelector: 'app-new',
    };

    await updateSelectorsInTemplates(
      'service',
      selectorTransfer,
      userMessage,
      debugLogger
    );

    expect(findReplaceSelectorsInTemplateFilesStub.called).to.be.false;
  });
});
