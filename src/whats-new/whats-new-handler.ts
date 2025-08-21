import * as path from 'path';
import * as vscode from 'vscode';

export class WhatsNewHandler {
  private static readonly LAST_VERSION_KEY =
    'renameAngularComponent.lastVersion';
  private static readonly CURRENT_VERSION = '4.0.0-beta.6';
  private static readonly WHATS_NEW_FILE = 'WHATS_NEW.md';

  constructor(private context: vscode.ExtensionContext) {}

  public async checkAndShowWhatsNew(): Promise<void> {
    const lastVersion = this.context.globalState.get<string>(
      WhatsNewHandler.LAST_VERSION_KEY
    );

    if (lastVersion !== WhatsNewHandler.CURRENT_VERSION) {
      await this.showWhatsNew();
      await this.context.globalState.update(
        WhatsNewHandler.LAST_VERSION_KEY,
        WhatsNewHandler.CURRENT_VERSION
      );
    }
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

  public async showWhatsNewManually(): Promise<void> {
    await this.showWhatsNew();
  }
}
