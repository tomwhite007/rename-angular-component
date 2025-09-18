import * as vscode from 'vscode';
import { UserMessage } from '../logging/user-message.class';
import AngularFileSuffixRemover, {
  renameAllAngularFiles,
} from './tools/remove-angular-suffixes';

/**
 * Handler for the suffix removal command
 */
export class SuffixRemovalHandler {
  constructor(private userMessage: UserMessage) {}

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

      // Show dropdown to select the suffix to remove
      const suffixChoice = await vscode.window.showQuickPick(
        [
          {
            label: 'All Angular file types',
            value: 'all',
            description:
              'Process all Angular file types (component, service, directive, pipe, guard, interceptor, resolver, module)',
          },
          {
            label: 'Component',
            value: 'component',
            description: 'Remove .component suffix from files and class names',
          },
          {
            label: 'Service',
            value: 'service',
            description: 'Remove .service suffix from files and class names',
          },
          {
            label: 'Directive',
            value: 'directive',
            description: 'Remove .directive suffix from files and class names',
          },
          {
            label: 'Pipe',
            value: 'pipe',
            description: 'Remove .pipe suffix from files and class names',
          },
          {
            label: 'Guard',
            value: 'guard',
            description: 'Remove .guard suffix from files and class names',
          },
          {
            label: 'Interceptor',
            value: 'interceptor',
            description:
              'Remove .interceptor suffix from files and class names',
          },
          {
            label: 'Resolver',
            value: 'resolver',
            description: 'Remove .resolver suffix from files and class names',
          },
          {
            label: 'Module',
            value: 'module',
            description: 'Remove .module suffix from files and class names',
          },
        ],
        {
          placeHolder: 'Select the Angular file type to rename',
          title: 'Angular Suffix Removal',
        }
      );

      if (!suffixChoice) {
        return; // User cancelled
      }

      const suffix = suffixChoice.value;

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
          return this.runRenamer(
            workspaceFolder.uri.fsPath,
            suffix,
            dryRunChoice.value,
            progress
          );
        }
      );
    } catch (error) {
      this.userMessage.logInfoToChannel([`Error in suffix removal: ${error}`]);
      vscode.window.showErrorMessage(`Error during suffix removal: ${error}`);
    }
  }

  /**
   * Run the suffix removal using the AngularFileRenamer class directly
   */
  private async runRenamer(
    workspacePath: string,
    suffix: string,
    dryRun: boolean,
    progress: vscode.Progress<{ message?: string; increment?: number }>
  ): Promise<void> {
    try {
      progress.report({
        message: `Running suffix removal for "${suffix}"...`,
      });

      this.userMessage.logInfoToChannel([
        `Running suffix removal: ${suffix} (dryRun: ${dryRun})`,
      ]);

      // Change to the workspace directory
      const originalCwd = process.cwd();
      process.chdir(workspacePath);

      // Check if user wants to process all Angular file types
      if (suffix.toLowerCase() === 'all') {
        await this.runAllAngularFiles(dryRun, progress);
        return;
      }

      // Create a custom user message interface that captures output
      let output = '';
      const capturingUserMessage = {
        logInfoToChannel: (textLines: string[]) => {
          // Log to the original user message
          this.userMessage.logInfoToChannel(textLines);
          // Also capture for the output document
          output += textLines.join('\n') + '\n';
        },
      };

      // Create an instance of the AngularFileRenamer with capturing user message
      const renamer = new AngularFileSuffixRemover(
        suffix,
        dryRun,
        capturingUserMessage
      );

      try {
        // Execute the renamer
        await renamer.execute();

        // Restore original working directory
        process.chdir(originalCwd);

        // Show success message
        const message = dryRun
          ? `Dry run completed for suffix "${suffix}". Check the output panel for details.`
          : `Successfully renamed files with suffix "${suffix}". Check the output panel for details.`;

        vscode.window.showInformationMessage(message);
      } catch (error) {
        // Restore original working directory
        process.chdir(originalCwd);

        throw error;
      }
    } catch (error) {
      const errorMessage = `Suffix removal failed: ${error}`;
      this.userMessage.logInfoToChannel([errorMessage]);
      vscode.window.showErrorMessage(errorMessage);
      throw error;
    }
  }

  /**
   * Run the rename operation for all Angular file types
   */
  private async runAllAngularFiles(
    dryRun: boolean,
    progress: vscode.Progress<{ message?: string; increment?: number }>
  ): Promise<void> {
    try {
      progress.report({
        message: 'Running comprehensive Angular file rename...',
      });

      this.userMessage.logInfoToChannel([
        `Running comprehensive Angular file rename (dryRun: ${dryRun})`,
      ]);

      try {
        // Execute the comprehensive rename operation with capturing user message
        await renameAllAngularFiles(dryRun, this.userMessage);

        // Show success message
        const message = dryRun
          ? `Dry run completed for all Angular file types. Check the output panel for details.`
          : `Successfully renamed all Angular files. Check the output panel for details.`;

        vscode.window.showInformationMessage(message);
      } catch (error) {
        throw error;
      }
    } catch (error) {
      const errorMessage = `Comprehensive Angular file rename failed: ${error}`;
      this.userMessage.logInfoToChannel([errorMessage]);
      vscode.window.showErrorMessage(errorMessage);
      throw error;
    }
  }
}
