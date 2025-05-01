import * as vscode from 'vscode';
import { FileItem } from '../../move-ts-indexer/file-item';
import { ReferenceIndexBuilder } from '../../move-ts-indexer/reference-index-builder';
import { timeoutPause } from '../../utils/timeout-pause';
import { DebugLogger } from '../logging/debug-logger.class';
import { UserMessage } from '../logging/user-message.class';

export class FileMoveHandler {
  constructor(
    private indexer: ReferenceIndexBuilder,
    private userMessage: UserMessage,
    private debugLogger: DebugLogger
  ) {}

  async runFileMoveJobs(
    fileMoveJobs: FileItem[],
    progress: vscode.Progress<{
      message?: string | undefined;
      increment?: number | undefined;
    }>
  ): Promise<void> {
    progress.report({ increment: 20 });
    await timeoutPause();
    const progressIncrement = Math.floor(70 / fileMoveJobs.length);
    let currentProgress = 20;
    this.userMessage.logInfoToChannel(['File edits:'], false);
    this.indexer.startNewMoves();
    for await (const item of fileMoveJobs) {
      currentProgress += progressIncrement;
      progress.report({ increment: currentProgress });
      await timeoutPause(10);
      await item.move(this.indexer);
    }
    this.logFileEditsToOutput(this.indexer.endNewMoves(), fileMoveJobs);
  }

  private logFileEditsToOutput(
    files: string[],
    fileMoveJobs: FileItem[]
  ): void {
    files = files.map(
      (file) =>
        fileMoveJobs.find((job: FileItem) => job.sourcePath === file)
          ?.targetPath ?? file
    );
    files = [...new Set(files.sort())];
    this.userMessage.logInfoToChannel(files);
  }
}
