import { OutputChannel } from 'vscode';
import { AngularConstruct } from '../definitions/file.interfaces';
import { logInfo } from './logInfo.function';

export function logErrors(
  construct: AngularConstruct,
  output: OutputChannel,
  textLines?: string[]
) {
  logInfo(
    ' failed. See output tab for more details.',
    construct,
    output,
    textLines
  );
}
