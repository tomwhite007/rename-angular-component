import * as vscode from 'vscode';
import { pascalCase } from 'pascal-case';
import {
  AngularConstruct,
  OriginalFileDetails,
} from './definitions/file.interfaces';
import { getProjectRoot } from './definitions/get-project-root-file-path.function';
import { ReferenceIndexer } from '../move-ts-indexer/reference-indexer';
import { FileItem } from '../move-ts-indexer/file-item';
import * as fs from 'fs-extra-promise';
import { paramCase } from 'change-case';
import { getOriginalFileDetails } from './in-file-edits/get-original-file-details.function';
import { windowsFilePathFix } from './file-manipulation/windows-file-path-fix.function';
import { FilesRelatedToStub } from './file-manipulation/files-related-to-stub.class';
import { findReplaceSelectorsInTemplateFiles } from './file-manipulation/find-replace-selectors-in-template-files.function';
import {
  getClassNameEdits,
  getCoreClassEdits,
  SelectorTransfer,
} from './in-file-edits/custom-edits';
import { checkForOpenUnsavedEditors } from './window/check-for-open-unsaved-editors.funtion';
import * as path from 'path';
import { UserMessage } from './logging/user-message.class';
import { EXTENSION_NAME } from './definitions/extension-name';
import { noSelectedFileHandler } from './no-selected-file-handler/no-selected-file-handler.function';
import { getOriginalClassName } from './in-file-edits/get-original-class-name.function';
import { getConfig } from './definitions/getConfig.function';
import { debugLogger } from './logging/debug-logger.function';

const timeoutPause = async (wait = 0) => {
  await new Promise((res) => setTimeout(res, wait));
  return;
};

export class Renamer {
  readonly constructsWithSelectors = ['component', 'directive'];
  private construct!: AngularConstruct;
  private title!: string;
  private originalFileDetails!: Readonly<OriginalFileDetails>;
  private projectRoot!: string;
  private newStub!: string;
  private processTimerStart!: number;
  private renameFolder!: boolean;
  private fileMoveJobs!: FileItem[];
  private selectorTransfer!: SelectorTransfer;
  private debugLogToFile?: (...args: string[]) => void;

  constructor(
    private indexer: ReferenceIndexer,
    private indexerInitialisePromise: Thenable<any>,
    private userMessage: UserMessage
  ) {}

  async rename(_construct: AngularConstruct, selectedUri: vscode.Uri) {
    const detailsLoaded = await this.setRenameDetails(_construct, selectedUri);
    if (!detailsLoaded) {
      return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: this.title + ' in progress',
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 0 });
        await timeoutPause();

        try {
          const fileMoveJobsReady = await this.setFileMoveJobs();
          if (!fileMoveJobsReady) {
            return;
          }

          await this.indexerMoveJobs(progress);

          this.updateSelectorsInTemplates();

          /* TODO 
 
          logger:
          add new line and confirm no overwrite
          test in windows

          click away from enter new stub causes error message in Output
          Also reuses state from last Rename process!
 
          ---- v2 -----
  
          fix numbers in string to camel case; remove underscore?
  
          refactor into classes
  
          replace selector references in (make config option):
            spec
            story and stories files
  
  
          handle open editors
            looks like reference indexer, replaceReferences() already can - need same for core class file
              apply edits in dirty editor?
  
          fix up / remove tsmove conf() configuration
  
          make sure input newStub matches constraints and formatting allowed by CLI
  
          refactor for clean classes, functions and pure async await
  
          ---- v3 -----
        */

          // delete original folder
          if (this.renameFolder) {
            fs.remove(this.originalFileDetails.path);
          }

          // report process completed
          progress.report({ increment: 100 });
          const renameTime =
            Math.round((Date.now() - this.processTimerStart) / 10) / 100;
          this.userMessage.logInfoToChannel([
            '',
            `${this.title} completed in ${renameTime} seconds`,
          ]);
          if (this.debugLogToFile) {
            this.debugLogToFile('## Debug Process Completed ##');
          }
          await timeoutPause(50);
        } catch (e: any) {
          this.reportErrors(e);
        }
      }
    );
  }

  private async indexerMoveJobs(
    progress: vscode.Progress<{
      message?: string | undefined;
      increment?: number | undefined;
    }>
  ) {
    progress.report({ increment: 20 });
    await timeoutPause();
    const progressIncrement = Math.floor(70 / this.fileMoveJobs.length);
    let currentProgress = 20;
    this.indexer.startNewMoves(this.fileMoveJobs);
    for (const item of this.fileMoveJobs) {
      currentProgress += progressIncrement;
      progress.report({ increment: currentProgress });
      await timeoutPause(10);
      await item.move(this.indexer);
    }
  }

  private async updateSelectorsInTemplates() {
    // update selectors for components and directives
    if (this.constructsWithSelectors.includes(this.construct)) {
      if (
        this.selectorTransfer.oldSelector &&
        this.selectorTransfer.newSelector
      ) {
        await findReplaceSelectorsInTemplateFiles(
          this.selectorTransfer.oldSelector,
          this.selectorTransfer.newSelector,
          this.userMessage
        );

        if (this.debugLogToFile) {
          this.debugLogToFile(
            'oldSelector: ' + this.selectorTransfer.oldSelector,
            'newSelector: ' + this.selectorTransfer.newSelector
          );
        }
      } else {
        throw new Error("Selector edit not found. Couldn't amend selector.");
      }
    }
  }

  private async setFileMoveJobs(): Promise<boolean> {
    const filesRelatedToStub = await FilesRelatedToStub.init(
      this.originalFileDetails,
      this.projectRoot,
      this.construct
    );
    this.renameFolder = filesRelatedToStub.folderNameSameAsStub;

    const filesToMove = filesRelatedToStub.getFilesToMove(
      this.newStub as string
    );
    if (!filesToMove.find((f) => f.isCoreConstruct)) {
      this.userMessage.popupMessage(
        `The ${this.construct} class file must use the same file naming convention as '${this.originalFileDetails.file}' for this process to run.`
      );
      return false;
    }

    const coreFilePath = filesToMove.find((f) => f.isCoreConstruct)?.filePath;
    const oldClassName = await getOriginalClassName(
      this.originalFileDetails.stub,
      coreFilePath as string,
      this.construct
    );
    const newClassName = `${pascalCase(this.newStub)}${pascalCase(
      this.construct
    )}`;

    this.selectorTransfer = new SelectorTransfer();

    this.fileMoveJobs = filesToMove.map((f) => {
      const additionalEdits = {
        importsEdits:
          path.extname(f.filePath) === '.ts'
            ? (() => getClassNameEdits(oldClassName, newClassName))()
            : undefined,
        movedFileEdits: f.isCoreConstruct
          ? (() =>
              getCoreClassEdits(
                oldClassName,
                newClassName,
                this.originalFileDetails.stub,
                this.newStub,
                this.construct,
                this.selectorTransfer,
                this.debugLogToFile
              ))()
          : undefined,
      };

      return new FileItem(
        windowsFilePathFix(f.filePath, true),
        windowsFilePathFix(f.newFilePath, true),
        fs.statSync(f.filePath).isDirectory(),
        oldClassName,
        newClassName,
        additionalEdits
      );
    });

    if (this.debugLogToFile) {
      this.debugLogToFile(
        'renameFolder: ' + this.renameFolder,
        '',
        'filesToMove: ',
        JSON.stringify(filesToMove),
        '',
        'fileMoveJobs: ',
        JSON.stringify(this.fileMoveJobs)
      );
    }

    if (this.fileMoveJobs.some((l) => l.exists())) {
      vscode.window.showErrorMessage('Not allowed to overwrite existing files');

      if (this.debugLogToFile) {
        this.debugLogToFile(
          'l.exists(): Not allowed to overwrite existing files'
        );
      }
      return false;
    }
    return true;
  }

  private reportErrors(e: any) {
    const raiseIssueMsgs = [
      `If it looks like a new issue, I'd welcome you raising it here: [${EXTENSION_NAME} Issues](https://github.com/tomwhite007/rename-angular-component/issues)`,
      `If it looks like an existing issue, I'd appreciate it if you'd +1 it on Github to chivvy me along`,
    ];

    const msg: string = e.message;
    if (msg.startsWith('Class Name') || msg.startsWith('Selector')) {
      this.userMessage.logInfoToChannel(['', msg, ...raiseIssueMsgs]);
      return;
    }

    console.log('error in extension.ts', e);
    this.userMessage.logInfoToChannel([
      `Sorry, an error occurred during the ${this.title} process`,
      `I recommend reverting the changes made if there are any`,
      ...raiseIssueMsgs,
    ]);
  }

  private async setRenameDetails(
    _construct: AngularConstruct,
    selectedUri: vscode.Uri
  ): Promise<boolean> {
    this.construct = _construct;
    this.title = `Rename Angular ${pascalCase(this.construct)}`;

    // Handle if called from command menu
    if (!selectedUri) {
      const userEntered = await noSelectedFileHandler(
        this.construct,
        this.title,
        this.userMessage
      );
      if (userEntered) {
        selectedUri = userEntered;
      } else {
        return false;
      }
    }

    this.originalFileDetails = getOriginalFileDetails(selectedUri.path);
    this.projectRoot = windowsFilePathFix(
      getProjectRoot(selectedUri) as string
    );
    if (getConfig('debugLog', false)) {
      this.debugLogToFile = debugLogger(this.projectRoot);
      this.debugLogToFile('## Debug Process Start ##');
    }

    if (checkForOpenUnsavedEditors()) {
      this.userMessage.popupMessage(
        `Please save any edits before using ${this.title}`
      );
      return false;
    }

    const inputResult = await vscode.window.showInputBox({
      title: this.title,
      prompt: `Enter the new ${this.construct} name.`,
      value: this.originalFileDetails.stub,
    });
    this.processTimerStart = Date.now();

    if (!inputResult) {
      this.userMessage.popupMessage(
        `New ${this.construct} name not entered. Stopped.`
      );
      return false;
    }
    if (this.originalFileDetails.stub === inputResult) {
      this.userMessage.popupMessage(
        `${pascalCase(this.construct)} name same as original. Stopped.`
      );
      return false;
    }
    if (!inputResult.match(/^[a-z0-9-_]*$/i)) {
      this.userMessage.popupMessage(
        `Currently only supports letters, numbers, dashes and underscore in the new name.`
      );
      return false;
    }
    // make sure it's kebab
    this.newStub = paramCase(inputResult ?? '');

    this.userMessage.setOperationTitle(this.title);

    // wait for indexer initialise to complete
    const indexTime = await this.indexerInitialisePromise;
    this.userMessage.logInfoToChannel(
      [
        `Index files completed in ${Math.round(indexTime * 100) / 100} seconds`,
        '',
      ],
      false
    );

    if (this.debugLogToFile) {
      this.debugLogToFile(
        'projectRoot: ' + this.projectRoot,
        '',
        'originalFileDetails:',
        JSON.stringify(this.originalFileDetails),
        '',
        'inputResult: ' + inputResult,
        '',
        'newStub: ' + this.newStub
      );
    }

    return true;
  }
}
