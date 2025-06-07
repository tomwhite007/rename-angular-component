import { CONSTRUCTS_WITH_SELECTORS } from '../definitions/constructs-with-selectors';
import { AngularConstruct } from '../definitions/file.interfaces';
import { SelectorTransfer } from '../in-file-edits/custom-edits';
import { DebugLogger } from '../logging/debug-logger.class';
import { UserMessage } from '../logging/user-message.class';
import { findReplaceSelectorsInTemplateFiles } from './find-replace-selectors-in-template-files.function';

export async function updateSelectorsInTemplates(
  construct: AngularConstruct,
  selectorTransfer: SelectorTransfer,
  userMessage: UserMessage,
  debugLogger: DebugLogger
): Promise<void> {
  if (CONSTRUCTS_WITH_SELECTORS.includes(construct)) {
    if (selectorTransfer.oldSelector && selectorTransfer.newSelector) {
      if (selectorTransfer.oldSelector !== selectorTransfer.newSelector) {
        await findReplaceSelectorsInTemplateFiles(
          selectorTransfer.oldSelector,
          selectorTransfer.newSelector,
          userMessage,
          construct
        );
      } else {
        userMessage.logInfoToChannel([
          ``,
          `Original Selector doesn't match Angular CLI naming convention for a ${construct}. Unexpected Selector not replaced.`,
        ]);
      }

      debugLogger.logToConsole(
        'oldSelector: ' + selectorTransfer.oldSelector,
        'newSelector: ' + selectorTransfer.newSelector
      );
    } else {
      throw new Error("Selector edit not found. Couldn't amend selector.");
    }
  }
}
