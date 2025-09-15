import { spawn } from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Handler for the suffix removal command
 */
export class SuffixRemovalHandler {
  constructor(private debugLogger: any) {}

  /**
   * Execute the suffix removal script
   */
  async execute(): Promise<void> {
    try {
      // Get the workspace folder
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
      }

      // Show input box to get the suffix to remove
      const suffix = await vscode.window.showInputBox({
        prompt:
          'Enter the suffix to remove (e.g., component, service, directive)',
        placeHolder: 'component',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Please enter a suffix to remove';
          }
          if (!/^[a-zA-Z]+$/.test(value)) {
            return 'Suffix should only contain letters';
          }
          return null;
        },
      });

      if (!suffix) {
        return; // User cancelled
      }

      // Ask if this should be a dry run
      const dryRunChoice = await vscode.window.showQuickPick(
        [
          { label: 'Preview changes (dry run)', value: true },
          { label: 'Apply changes', value: false },
        ],
        {
          placeHolder: 'Choose how to proceed',
          title: 'Suffix Removal Mode',
        }
      );

      if (!dryRunChoice) {
        return; // User cancelled
      }

      // Show progress
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Renaming Angular suffixes (${suffix})...`,
          cancellable: false,
        },
        async (progress) => {
          return this.runScript(
            workspaceFolder.uri.fsPath,
            suffix,
            dryRunChoice.value,
            progress
          );
        }
      );
    } catch (error) {
      this.debugLogger.logToConsole(`Error in suffix removal: ${error}`);
      vscode.window.showErrorMessage(`Error during suffix removal: ${error}`);
    }
  }

  /**
   * Run the suffix removal script
   */
  private async runScript(
    workspacePath: string,
    suffix: string,
    dryRun: boolean,
    progress: vscode.Progress<{ message?: string; increment?: number }>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Path to the script
      const scriptPath = path.join(
        __dirname,
        'tools',
        'dist',
        'rename-angular-files.js'
      );

      // Build command arguments
      const args = [suffix];
      if (dryRun) {
        args.push('--dry-run');
      }

      progress.report({
        message: `Running suffix removal script for "${suffix}"...`,
      });

      this.debugLogger.logToConsole(
        `Running script: node ${scriptPath} ${args.join(' ')}`
      );

      // Spawn the Node.js process
      const child = spawn('node', [scriptPath, ...args], {
        cwd: workspacePath,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        const message = data.toString();
        output += message;
        this.debugLogger.logToConsole(`Script output: ${message}`);
      });

      child.stderr.on('data', (data) => {
        const message = data.toString();
        errorOutput += message;
        this.debugLogger.logToConsole(`Script error: ${message}`);
      });

      child.on('close', (code) => {
        if (code === 0) {
          // Show success message with output
          const message = dryRun
            ? `Dry run completed for suffix "${suffix}". Check the output panel for details.`
            : `Successfully renamed files with suffix "${suffix}". Check the output panel for details.`;

          vscode.window.showInformationMessage(message);

          // Show output in a new document
          this.showOutput(output, suffix, dryRun);

          resolve();
        } else {
          const errorMessage = `Script failed with exit code ${code}. Error: ${errorOutput}`;
          this.debugLogger.logToConsole(errorMessage);
          vscode.window.showErrorMessage(errorMessage);
          reject(new Error(errorMessage));
        }
      });

      child.on('error', (error) => {
        const errorMessage = `Failed to start script: ${error.message}`;
        this.debugLogger.logToConsole(errorMessage);
        vscode.window.showErrorMessage(errorMessage);
        reject(error);
      });
    });
  }

  /**
   * Show the script output in a new document
   */
  private async showOutput(
    output: string,
    suffix: string,
    dryRun: boolean
  ): Promise<void> {
    const doc = await vscode.workspace.openTextDocument({
      content: output,
      language: 'plaintext',
    });

    const title = dryRun
      ? `Suffix Removal Preview - ${suffix}`
      : `Suffix Removal Results - ${suffix}`;

    await vscode.window.showTextDocument(doc, {
      preview: false,
      viewColumn: vscode.ViewColumn.Beside,
    });
  }
}
