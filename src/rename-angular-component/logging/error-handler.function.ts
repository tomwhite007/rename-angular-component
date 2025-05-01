import { DebugLogger } from './debug-logger.class';
import { UserMessage } from './user-message.class';

export function reportErrors(
  e: any,
  title: string,
  userMessage: UserMessage,
  debugLogger: DebugLogger
): void {
  const raiseIssueMsgs = [
    `If it looks like a new issue, we'd appreciate you raising it here: https://github.com/tomwhite007/rename-angular-component/issues`,
    `We're actively fixing any bugs reported.`,
  ];

  const msg: string = e.message;
  if (msg.startsWith('Class Name') || msg.startsWith('Selector')) {
    userMessage.logInfoToChannel(['', msg, ...raiseIssueMsgs]);
    return;
  }

  console.log('error in Renamer:', e);
  userMessage.logInfoToChannel([
    `Sorry, an error occurred during the ${title} process`,
    `We recommend reverting the changes made if there are any`,
    ...raiseIssueMsgs,
  ]);
  debugLogger.log(
    'Renamer error: ',
    JSON.stringify(e, Object.getOwnPropertyNames(e))
  );
}
