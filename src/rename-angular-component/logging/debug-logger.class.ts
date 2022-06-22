import { workspace } from 'vscode';
import * as path from 'path';

export class DebugLogger {
  private preSaveCash = '';
  private debugFilePath?: string;

  constructor(private logToFile: boolean) {}

  log(...text: string[]) {
    let fileContents = this.getCurrentFileContents();

    for (const line of text) {
      fileContents += line + '\n';
    }

    this.saveToFile(fileContents);
  }

  setWorkspaceRoot(workspaceRootFolder: string) {
    if (!this.logToFile) {
      return;
    }

    const newPath = path.join(
      workspaceRootFolder,
      'rename-angular-component-debug-log.txt'
    );

    if (this.debugFilePath === newPath) {
      return;
    }
    if (this.debugFilePath) {
      throw new Error('Workspace Root already set');
    }

    this.debugFilePath = newPath;
    this.saveToFile(this.preSaveCash);
    this.preSaveCash = '';
  }

  getCashedLog() {
    return this.preSaveCash;
  }

  private getCurrentFileContents() {
    if (!this.debugFilePath) {
      return this.preSaveCash;
    }
    let fileContents = '';
    if (fs.existsSync(this.debugFilePath)) {
      fileContents = workspace.fs.readFileSync(this.debugFilePath, 'utf-8');
      fileContents += '\n---\n';
    }
    return fileContents;
  }

  private saveToFile(fileContents: string) {
    if (!this.debugFilePath) {
      this.preSaveCash = fileContents;
    } else {
      workspace.fs.writeFileSync(this.debugFilePath, fileContents, 'utf-8');
    }
  }
}
