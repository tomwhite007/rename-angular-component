import * as vscode from 'vscode';
import {
  AngularConstruct,
  OriginalFileDetails,
} from './definitions/file.interfaces';
import { getProjectRoot } from './definitions/get-project-root-file-path.function';
import { ReferenceIndexBuilder } from '../move-ts-indexer/reference-index-builder';
import { FileItem } from '../move-ts-indexer/file-item';
import * as fs from 'fs-extra-promise';
import { getOriginalFileDetails } from './in-file-edits/get-original-file-details.function';
import { windowsFilePathFix } from './file-manipulation/windows-file-path-fix.function';
import { FilesRelatedToStub } from './file-manipulation/files-related-to-stub.class';
import { findReplaceSelectorsInTemplateFiles } from './file-manipulation/find-replace-selectors-in-template-files.function';
import {
  getClassNameEdits,
  getCoreClassEdits,
  SelectorTransfer,
} from './in-file-edits/custom-edits';
import { checkForOpenUnsavedEditors } from './window/check-for-open-unsaved-editors.function';
import * as path from 'path';
import { UserMessage } from './logging/user-message.class';
import { noSelectedFileHandler } from './no-selected-file-handler/no-selected-file-handler.function';
import { getOriginalClassName } from './in-file-edits/get-original-class-name.function';
import { DebugLogger } from './logging/debug-logger.class';
import { validateHtmlSelector } from '../angular-cli/validation';
import { classify, dasherize } from '../angular-cli/strings';
import { CONSTRUCTS_WITH_SELECTORS } from './definitions/constructs-with-selectors';
import { timeoutPause } from '../utils/timeout-pause';
import { getCoreFilePath } from './in-file-edits/get-core-file-path.function';

export class Renamer {
  private construct!: AngularConstruct;
  private title!: string;
  private originalFileDetails!: Readonly<OriginalFileDetails>;
  private projectRoot!: string;
  private newStub!: string;
  private processTimerStart!: number;
  private renameFolder!: boolean;
  private fileMoveJobs!: FileItem[];
  private selectorTransfer!: SelectorTransfer;
  public testBypass?: { stub: string };

  constructor(
    private indexer: ReferenceIndexBuilder,
    private indexerInitialisePromise: Thenable<any>,
    private userMessage: UserMessage,
    private debugLogger: DebugLogger
  ) {}

  async rename(_construct: AngularConstruct, selectedUri: vscode.Uri) {
    console.log('Rename process start');
    this.debugLogger.log('## Debug Rename Start ##');

    const detailsLoaded = await this.prepRenameDetails(_construct, selectedUri);
    if (!detailsLoaded) {
      this.debugLogger.log(
        'setRenameDetails returned false, stopping.',
        '## Debug Rename End ##'
      );
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
          const fileMoveJobsReady = await this.prepFileMoveJobs();
          if (!fileMoveJobsReady) {
            return;
          }

          await this.runFileMoveJobs(progress);

          await this.updateSelectorsInTemplates();

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

          this.debugLogger.log('## Debug Rename Completed ##');

          await timeoutPause(50);
          console.log('Rename process end');
        } catch (e: any) {
          this.reportErrors(e);
          console.log('Rename process ended with errors');
        }
      }
    );
  }

  private async runFileMoveJobs(
    progress: vscode.Progress<{
      message?: string | undefined;
      increment?: number | undefined;
    }>
  ) {
    progress.report({ increment: 20 });
    await timeoutPause();
    const progressIncrement = Math.floor(70 / this.fileMoveJobs.length);
    let currentProgress = 20;
    this.userMessage.logInfoToChannel(['File edits:'], false);
    this.indexer.startNewMoves();
    for await (const item of this.fileMoveJobs) {
      currentProgress += progressIncrement;
      progress.report({ increment: currentProgress });
      await timeoutPause(10);
      await item.move(this.indexer);
    }
    this.logFileEditsToOutput(this.indexer.endNewMoves());
  }

  private logFileEditsToOutput(files: string[]) {
    files = files.map(
      (file) =>
        this.fileMoveJobs.find((job) => job.sourcePath === file)?.targetPath ??
        file
    );
    files = [...new Set(files.sort())];
    this.userMessage.logInfoToChannel(files);
  }

  private async updateSelectorsInTemplates() {
    // update selectors for components and directives
    if (CONSTRUCTS_WITH_SELECTORS.includes(this.construct)) {
      if (
        this.selectorTransfer.oldSelector &&
        this.selectorTransfer.newSelector
      ) {
        if (
          this.selectorTransfer.oldSelector !==
          this.selectorTransfer.newSelector
        ) {
          await findReplaceSelectorsInTemplateFiles(
            this.selectorTransfer.oldSelector,
            this.selectorTransfer.newSelector,
            this.userMessage
          );
        } else {
          this.userMessage.logInfoToChannel([
            ``,
            `Original Selector doesn't match Angular CLI naming convention for a ${this.construct}. Unexpected Selector not replaced.`,
          ]);
        }

        this.debugLogger.log(
          'oldSelector: ' + this.selectorTransfer.oldSelector,
          'newSelector: ' + this.selectorTransfer.newSelector
        );
      } else {
        throw new Error("Selector edit not found. Couldn't amend selector.");
      }
    }
  }

  private async prepFileMoveJobs(): Promise<boolean> {
    this.debugLogger.log(
      'find related glob: ',
      `${this.originalFileDetails.path.replace(
        this.projectRoot + '/',
        ''
      )}/**/*`
    );

    const filesRelatedToStub = await FilesRelatedToStub.init(
      this.originalFileDetails,
      this.projectRoot,
      this.construct
    );
    this.renameFolder = filesRelatedToStub.folderNameSameAsStub;

    const filesToMove = filesRelatedToStub.getFilesToMove(
      this.newStub as string
    );

    this.debugLogger.log(
      'renameFolder: ' + this.renameFolder,
      '',
      'filesToMove: ',
      JSON.stringify(filesToMove)
    );

    if (!filesToMove.find((f) => f.isCoreConstruct)) {
      const errMsg = `The ${this.construct} class file must use the same file naming convention as '${this.originalFileDetails.file}' for this process to run.`;
      this.userMessage.popupMessage(errMsg);
      this.debugLogger.log(errMsg);
      return false;
    }

    const coreFilePath = getCoreFilePath(filesToMove);
    const oldClassName = await getOriginalClassName(
      this.originalFileDetails.stub,
      coreFilePath as string,
      this.construct
    );
    const newClassName = `${classify(this.newStub)}${classify(this.construct)}`;

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
                this.selectorTransfer
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

    this.debugLogger.log('fileMoveJobs: ', JSON.stringify(this.fileMoveJobs));

    if (this.fileMoveJobs.some((l) => l.exists())) {
      vscode.window.showErrorMessage('Not allowed to overwrite existing files');

      this.debugLogger.log(
        'l.exists(): Not allowed to overwrite existing files'
      );

      return false;
    }
    return true;
  }

  private reportErrors(e: any) {
    const raiseIssueMsgs = [
      `If it looks like a new issue, we'd appreciate you raising it here: https://github.com/tomwhite007/rename-angular-component/issues`,
      `We're actively fixing any bugs reported.`,
    ];

    const msg: string = e.message;
    if (msg.startsWith('Class Name') || msg.startsWith('Selector')) {
      this.userMessage.logInfoToChannel(['', msg, ...raiseIssueMsgs]);
      return;
    }

    console.log('error in Renamer:', e);
    this.userMessage.logInfoToChannel([
      `Sorry, an error occurred during the ${this.title} process`,
      `We recommend reverting the changes made if there are any`,
      ...raiseIssueMsgs,
    ]);
    this.debugLogger.log(
      'Renamer error: ',
      JSON.stringify(e, Object.getOwnPropertyNames(e))
    );
  }

  private async prepRenameDetails(
    _construct: AngularConstruct,
    selectedUri: vscode.Uri
  ): Promise<boolean> {
    try {
      this.construct = _construct;
      this.title = `Rename Angular ${classify(this.construct)}`;

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
      this.debugLogger.setWorkspaceRoot(this.projectRoot);

      if (checkForOpenUnsavedEditors()) {
        this.userMessage.popupMessage(
          `Please save any edits before using ${this.title}`
        );
        return false;
      }

      const inputResult =
        this.testBypass?.stub ?? // test harness input text
        (await vscode.window.showInputBox({
          title: this.title,
          prompt: `Enter the new ${this.construct} name.`,
          value: this.originalFileDetails.stub,
        }));
      this.processTimerStart = Date.now();

      if (!inputResult) {
        this.userMessage.popupMessage(
          `New ${this.construct} name not entered. Stopped.`
        );
        return false;
      }
      if (this.originalFileDetails.stub === inputResult) {
        this.userMessage.popupMessage(
          `${classify(this.construct)} name same as original. Stopped.`
        );
        return false;
      }
      if (!validateHtmlSelector('app-' + dasherize(inputResult))) {
        this.userMessage.popupMessage(
          `Please enter a name that formats to a valid Selector name (W3C standards). \n
          Must start name with a letter, then letters, numbers, full stop, dash or underscore, ending with a letter or number.`
        );
        return false;
      }
      // make sure it's kebab, and lose the dots
      this.newStub = dasherize(inputResult.replace('.', '-') ?? '');

      this.userMessage.setOperationTitle(this.title);

      // wait for indexer initialise to complete
      const indexTime = await this.indexerInitialisePromise;
      this.userMessage.logInfoToChannel(
        [
          `Index files completed in ${
            Math.round(indexTime * 100) / 100
          } seconds`,
          '',
        ],
        false
      );

      this.debugLogger.log(
        'projectRoot: ' + this.projectRoot,
        '',
        'originalFileDetails:',
        JSON.stringify(this.originalFileDetails),
        '',
        'inputResult: ' + inputResult,
        '',
        'newStub: ' + this.newStub
      );

      return true;
    } catch (e: any) {
      console.warn('setRenameDetails error: ', e);
      this.debugLogger.log(
        'setRenameDetails error: ',
        JSON.stringify(e, Object.getOwnPropertyNames(e))
      );
      return false;
    }
  }
}
