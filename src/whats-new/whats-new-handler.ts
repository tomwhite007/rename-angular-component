import * as fs from 'fs-extra-promise';
import * as path from 'path';
import * as vscode from 'vscode';
import { conf } from '../move-ts-indexer/util/helper-functions';

export class WhatsNewHandler {
  private static readonly LAST_VERSION_KEY =
    'renameAngularComponent.lastVersion';
  private static readonly WHATS_NEW_FILE = 'WHATS_NEW.md';

  constructor(private context: vscode.ExtensionContext) {}

  public async checkAndShowWhatsNew(): Promise<void> {
    // Check if the user has disabled the What's New screen
    const showWhatsNewPopup = conf('showWhatsNewPopup', true);
    if (!showWhatsNewPopup) {
      return;
    }

    const currentVersion = await this.getCurrentVersion();
    const lastVersion = this.context.globalState.get<string>(
      WhatsNewHandler.LAST_VERSION_KEY
    );

    // If lastVersion is undefined, this is a fresh install - just save the version
    if (lastVersion === undefined) {
      await this.updateStoredVersion(currentVersion);
      return;
    }

    // TODO: Uncomment this for next major breaking change
    // Only show What's New if this is an actual update (version changed)
    // if (lastVersion !== currentVersion) {
    //   await this.showWhatsNew();
    //   await this.updateStoredVersion(currentVersion);
    // }
  }

  public async showWhatsNewManually(): Promise<void> {
    await this.showWhatsNew();
  }

  // For development/testing: reset the stored version
  public async resetStoredVersion(): Promise<void> {
    await this.context.globalState.update(
      WhatsNewHandler.LAST_VERSION_KEY,
      undefined
    );
  }

  // Disable the What's New screen
  public async disableWhatsNew(): Promise<void> {
    await vscode.workspace
      .getConfiguration('renameAngularComponent')
      .update('showWhatsNewPopup', false, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(
      "What's New screen has been disabled. You can re-enable it in VS Code settings."
    );
  }

  private async showWhatsNew(): Promise<void> {
    try {
      const whatsNewPath = path.join(
        this.context.extensionPath,
        WhatsNewHandler.WHATS_NEW_FILE
      );

      // Check if the file exists
      try {
        await vscode.workspace.fs.stat(vscode.Uri.file(whatsNewPath));
      } catch {
        // File doesn't exist, nothing to show
        return;
      }

      // Open the markdown file in preview mode
      const uri = vscode.Uri.file(whatsNewPath);
      await vscode.commands.executeCommand('markdown.showPreview', uri);
    } catch (error) {
      console.error("Error showing What's New:", error);
    }
  }

  private async getCurrentVersion(): Promise<string> {
    try {
      const packageJsonPath = path.join(
        this.context.extensionPath,
        'package.json'
      );
      const packageJsonContent = await fs.readFileAsync(
        packageJsonPath,
        'utf8'
      );
      const packageJson = JSON.parse(packageJsonContent);
      return packageJson.version;
    } catch (error) {
      console.error('Error reading package.json version:', error);
      return 'unknown';
    }
  }

  private async updateStoredVersion(version: string): Promise<void> {
    await this.context.globalState.update(
      WhatsNewHandler.LAST_VERSION_KEY,
      version
    );
  }
}
