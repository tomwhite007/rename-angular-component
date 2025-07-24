import vscode from 'vscode';
import { FileItem } from '../../move-ts-indexer/file-item';
import { ReferenceIndexBuilder } from '../../move-ts-indexer/reference-index-builder';
import { timeoutPause } from '../../utils/timeout-pause';
import { UserMessage } from '../logging/user-message.class';

export class FileMoveHandler {
  constructor(
    private indexer: ReferenceIndexBuilder,
    private userMessage: UserMessage
  ) {}

  async runFileMoveJobs(
    fileMoveJobs: FileItem[],
    progress: vscode.Progress<{
      message?: string | undefined;
      increment?: number | undefined;
    }>,
    projectRoot: string
  ): Promise<string[]> {
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
    const files = this.indexer.endNewMoves();
    const affectedFiles = this.generateFilePathsAffected(
      files,
      fileMoveJobs,
      projectRoot
    );
    this.logFileEditsToOutput(affectedFiles, projectRoot);
    return affectedFiles;
  }

  private logFileEditsToOutput(
    affectedFiles: string[],
    projectRoot: string
  ): void {
    this.userMessage.logInfoToChannel(
      affectedFiles.map((file) => file.replace(`${projectRoot}/`, ''))
    );
  }

  private generateFilePathsAffected(
    files: string[],
    fileMoveJobs: FileItem[],
    projectRoot: string
  ): string[] {
    let affectedFiles = files.map(
      (file) =>
        fileMoveJobs.find((job: FileItem) => job.sourcePath === file)
          ?.targetPath ?? file
    );
    affectedFiles = [...new Set(affectedFiles.sort())];
    return affectedFiles;
  }
}
