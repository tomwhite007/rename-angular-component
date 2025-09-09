import { CONSTRUCTS_WITH_SELECTORS } from '../definitions/constructs-with-selectors';
import { AngularConstructOrPlainFile } from '../definitions/file.interfaces';
import { SelectorTransfer } from '../in-file-edits/custom-edits';
import { DebugLogger } from '../logging/debug-logger.class';
import { UserMessage } from '../logging/user-message.class';
import { findReplaceSelectorsInTemplateFiles } from './find-replace-selectors-in-template-files.function';

export async function updateSelectorsInTemplates(
  construct: AngularConstructOrPlainFile | null,
  selectorTransfer: SelectorTransfer,
  userMessage: UserMessage,
  debugLogger: DebugLogger,
  coreFilePath: string,
  baseFilePathsAffected: string[]
): Promise<void> {
  if (construct && CONSTRUCTS_WITH_SELECTORS.includes(construct)) {
    if (selectorTransfer.oldSelector && selectorTransfer.newSelector) {
      if (selectorTransfer.oldSelector !== selectorTransfer.newSelector) {
        await findReplaceSelectorsInTemplateFiles(
          selectorTransfer.oldSelector,
          selectorTransfer.newSelector,
          userMessage,
          construct,
          coreFilePath,
          baseFilePathsAffected,
          debugLogger
        );
      } else {
        const message = selectorTransfer.generatedSelectorIsSameAsOld
          ? `Selector for ${construct} is unchanged. No updates to templates.`
          : `Original Selector doesn't match Angular CLI naming convention for a ${construct}. Unexpected Selector not replaced.`;
        userMessage.logInfoToChannel([``, message]);
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
