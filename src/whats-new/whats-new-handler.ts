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
    const showWhatsNew = conf('showWhatsNew', true);
    if (!showWhatsNew) {
      return;
    }

    const currentVersion = await this.getCurrentVersion();
    const lastVersion = this.context.globalState.get<string>(
      WhatsNewHandler.LAST_VERSION_KEY
    );

    // TODO: Uncomment this after 4.0.0 is released
    // If lastVersion is undefined, this is a fresh install - just save the version
    // if (lastVersion === undefined) {
    //   await this.updateStoredVersion(currentVersion);
    //   return;
    // }

    // Only show What's New if this is an actual update (version changed)
    if (lastVersion !== currentVersion) {
      await this.showWhatsNew();
      await this.updateStoredVersion(currentVersion);
    }
  }

  private async updateStoredVersion(version: string): Promise<void> {
    await this.context.globalState.update(
      WhatsNewHandler.LAST_VERSION_KEY,
      version
    );
  }

  public async showWhatsNewManually(): Promise<void> {
    await this.showWhatsNew();
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

      // Open the markdown file
      const document = await vscode.workspace.openTextDocument(whatsNewPath);
      await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
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
}
