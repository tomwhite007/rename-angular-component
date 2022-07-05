import { Uri, workspace } from 'vscode';
import * as path from 'path';
import { fileExists } from '../../utils/fileExists.function';
import { readFile } from '../../utils/readFile.function';
import { writeFile } from '../../utils/writeFile.function';

export class DebugLogger {
  private preSaveCash = '';
  private debugFileUri?: Uri;

  constructor(private logToFile: boolean) {}

  async log(...text: string[]) {
    let fileContents = await this.getCurrentFileContents();

    for (const line of text) {
      fileContents += line + '\n';
    }

    this.saveToFile(fileContents);
  }

  async setWorkspaceRoot(workspaceRootFolder: string) {
    if (!this.logToFile) {
      return;
    }

    const newPath = path.join(
      workspaceRootFolder,
      'rename-angular-component-debug-log.txt'
    );

    if (this.debugFileUri?.fsPath === newPath) {
      return;
    }
    if (this.debugFileUri) {
      throw new Error('Workspace Root already set');
    }

    this.debugFileUri = Uri.file(newPath);
    await this.saveToFile(this.preSaveCash);
    this.preSaveCash = '';
  }

  getCashedLog() {
    return this.preSaveCash;
  }

  private async getCurrentFileContents() {
    if (!this.debugFileUri) {
      return this.preSaveCash;
    }
    let fileContents = '';
    if (this.debugFileUri && (await fileExists(this.debugFileUri))) {
      fileContents = await readFile(this.debugFileUri);
      fileContents += '\n---\n';
    }
    return fileContents;
  }

  private async saveToFile(fileContents: string) {
    if (!this.debugFileUri) {
      this.preSaveCash = fileContents;
    } else {
      await writeFile(this.debugFileUri, fileContents);
    }
  }
}
