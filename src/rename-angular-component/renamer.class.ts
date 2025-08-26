import fs from 'fs-extra-promise';
import path from 'path';
import vscode from 'vscode';
import { classify, dasherize } from '../angular-cli/strings';
import { validateHtmlSelector } from '../angular-cli/validation';
import { GenericEditsCallback } from '../move-ts-indexer/apply-generic-edits';
import { FileItem } from '../move-ts-indexer/file-item';
import { timeoutPause } from '../utils/timeout-pause';
import {
  AngularConstructOrPlainFile,
  OriginalFileDetails,
} from './definitions/file.interfaces';
import { getProjectRoot } from './definitions/get-project-root-file-path.function';
import { FileMoveHandler } from './file-manipulation/file-move-handler.class';
import {
  FilesRelatedToStub,
  FileToMove,
} from './file-manipulation/files-related-to-stub.class';
import { updateSelectorsInTemplates } from './file-manipulation/selector-update-handler.function';
import { windowsFilePathFix } from './file-manipulation/windows-file-path-fix.function';
import {
  getAngularCoreClassEdits,
  getClassNameEdits,
  SelectorTransfer,
} from './in-file-edits/custom-edits';
import { getNewDefinitionName } from './in-file-edits/get-new-definition-name.function';
import { getNewStubFromFileWithoutExtension } from './in-file-edits/get-new-stub-from-file-without-extension';
import { getOriginalFileDetails } from './in-file-edits/get-original-file-details.function';
import { removeExtension } from './in-file-edits/remove-extension';
import { DebugLogger } from './logging/debug-logger.class';
import { reportErrors } from './logging/error-handler.function';
import { UserMessage } from './logging/user-message.class';
import { noSelectedFileHandler } from './no-selected-file-handler/no-selected-file-handler.function';
import { checkForOpenUnsavedEditors } from './window/check-for-open-unsaved-editors.function';

interface RenameContext {
  construct: AngularConstructOrPlainFile | null;
  title: string;
  originalFileDetails: Readonly<OriginalFileDetails>;
  filesRelatedToStub?: FilesRelatedToStub;
  projectRoot: string;
  newStub: string;
  newFilenameInput: string;
  processTimerStart: number;
  fileMoveJobs: FileItem[];
  selectorTransfer: SelectorTransfer;
  coreConstructNewFilePath?: string;
  newClassName?: string;
}

export class Renamer {
  private context: Partial<RenameContext> = {};
  public testBypass?: { newFilenameInput: string };

  constructor(
    private indexerInitialisePromise: Thenable<any>,
    private userMessage: UserMessage,
    private debugLogger: DebugLogger,
    private fileMoveHandler: FileMoveHandler
  ) {}

  async rename(
    construct: AngularConstructOrPlainFile,
    selectedUri: vscode.Uri
  ): Promise<void> {
    this.debugLogger.logToConsole('## Debug Rename Start ##');

    const detailsLoaded = await this.prepareRenameDetails(
      construct,
      selectedUri
    );
    if (!detailsLoaded) {
      this.debugLogger.log(
        'prepareRenameDetails returned false, stopping.',
        '## Debug Rename End ##'
      );
      return;
    }

    await this.executeRenameWithProgress();
  }

  private async executeRenameWithProgress(): Promise<void> {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `${this.context.title} in progress`,
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 0 });
        await timeoutPause();

        try {
          await this.performRenameOperation(progress);
        } catch (error: any) {
          reportErrors(
            error,
            this.context.title!,
            this.userMessage,
            this.debugLogger
          );
          console.log('Rename process ended with errors', error);
        }
      }
    );
  }

  private async performRenameOperation(
    progress: vscode.Progress<{ increment: number }>
  ): Promise<void> {
    const fileMoveJobsReady = await this.prepareFileMoveJobs();
    if (!fileMoveJobsReady) {
      return;
    }

    const filePathsAffected = await this.fileMoveHandler.runFileMoveJobs(
      this.context.fileMoveJobs!,
      progress,
      this.context.projectRoot!
    );
    const baseFilePathsAffected = filePathsAffected.map((filePath) =>
      filePath.replace(/(\.module)?\.ts$/, '')
    );
    this.debugLogger.log(
      'baseFilePathsAffected: ',
      JSON.stringify(baseFilePathsAffected)
    );

    await updateSelectorsInTemplates(
      this.context.construct!,
      this.context.selectorTransfer!,
      this.userMessage,
      this.debugLogger,
      this.context.coreConstructNewFilePath!,
      baseFilePathsAffected
    );

    await this.cleanupOriginalFolder();
    await this.reportCompletion(progress);
  }

  private async cleanupOriginalFolder(): Promise<void> {
    const { originalFileDetails, filesRelatedToStub } = this.context;

    if (
      originalFileDetails!.path !== filesRelatedToStub?.newFolderPath &&
      filesRelatedToStub?.newFolderPath !== undefined
    ) {
      this.debugLogger.logToConsole(
        'Deleting original folder: ',
        originalFileDetails!.path,
        'newFolderPath: ',
        filesRelatedToStub?.newFolderPath ?? 'undefined'
      );
      await fs.remove(originalFileDetails!.path);
    }
  }

  private async reportCompletion(
    progress: vscode.Progress<{ increment: number }>
  ): Promise<void> {
    progress.report({ increment: 100 });

    const renameTime = this.calculateRenameTime();
    const unrecognisedDefinitionMessage =
      this.getUnrecognisedDefinitionMessage();

    this.userMessage.logInfoToChannel([
      ...unrecognisedDefinitionMessage,
      '',
      `${this.context.title} completed in ${renameTime} seconds`,
    ]);

    this.debugLogger.log('## Debug Rename Completed ##');
    await timeoutPause(50);
    console.log('Rename process end');
  }

  private calculateRenameTime(): number {
    return (
      Math.round((Date.now() - this.context.processTimerStart!) / 10) / 100
    );
  }

  private getUnrecognisedDefinitionMessage(): string[] {
    const unrecognisedDefinition =
      !this.context.filesRelatedToStub?.definitionType;

    return unrecognisedDefinition
      ? [
          '',
          `This extension currently only supports renaming classes, functions, variables, interfaces, and enums that have the same name as the file they are in.`,
          `In this case, I could only rename the file, not any definition in the file.`,
        ]
      : [];
  }

  private async prepareFileMoveJobs(): Promise<boolean> {
    if (!this.context.filesRelatedToStub) {
      this.debugLogger.log('filesRelatedToStub is not set, stopping.');
      return false;
    }

    this.logFileMovePreparation();

    const filesToMove = this.context.filesRelatedToStub.getFilesToMove(
      this.context.newStub!,
      this.context.newFilenameInput!
    );

    this.debugLogger.log(
      'newFolderPath: ' + this.context.filesRelatedToStub.newFolderPath,
      '',
      'filesToMove: ',
      JSON.stringify(filesToMove)
    );

    this.createFileMoveJobs(filesToMove);

    this.debugLogger.log(
      'fileMoveJobs: ',
      JSON.stringify(this.context.fileMoveJobs)
    );

    if (this.hasConflictingFiles()) {
      vscode.window.showErrorMessage('Not allowed to overwrite existing files');
      this.debugLogger.logToConsole(
        'l.exists(): Not allowed to overwrite existing files'
      );
      return false;
    }

    return true;
  }

  private logFileMovePreparation(): void {
    this.debugLogger.log(
      'find related glob: ',
      `${this.context.originalFileDetails!.path.replace(
        this.context.projectRoot! + '/',
        ''
      )}/**/*`
    );
  }

  private createFileMoveJobs(filesToMove: any[]): void {
    const oldClassName =
      this.context.filesRelatedToStub!.originalDefinitionName!;
    const newClassName = getNewDefinitionName(
      this.context.newFilenameInput!,
      this.context.construct!,
      this.context.filesRelatedToStub!.definitionType
    );
    this.context.newClassName = newClassName;

    this.context.selectorTransfer = new SelectorTransfer();

    this.context.fileMoveJobs = filesToMove.map((file: FileToMove) => {
      const additionalEdits = this.createAdditionalEdits(
        file,
        oldClassName,
        newClassName
      );

      if (file.isCoreConstruct) {
        this.context.coreConstructNewFilePath = file.newFilePath;
      }
      return new FileItem(
        windowsFilePathFix(file.filePath, true),
        windowsFilePathFix(file.newFilePath, true),
        fs.statSync(file.filePath).isDirectory(),
        oldClassName,
        newClassName,
        additionalEdits
      );
    });
  }

  private createAdditionalEdits(
    file: FileToMove,
    oldClassName: string,
    newClassName: string
  ): {
    importsEdits?: GenericEditsCallback;
    movedFileEdits?: GenericEditsCallback;
  } {
    return {
      importsEdits:
        path.extname(file.filePath) === '.ts'
          ? getClassNameEdits(oldClassName, newClassName)
          : undefined,
      movedFileEdits: file.isCoreConstruct
        ? getAngularCoreClassEdits(
            oldClassName,
            newClassName,
            this.context.originalFileDetails!.stub,
            this.context.originalFileDetails!.fileWithoutType,
            this.context.newStub!,
            this.context.newFilenameInput!,
            this.context.construct!,
            this.context.selectorTransfer!
          )
        : undefined,
    };
  }

  private hasConflictingFiles(): boolean {
    return this.context.fileMoveJobs!.some(
      (job) => job.sourcePath !== job.targetPath && job.exists()
    );
  }

  private async prepareRenameDetails(
    construct: AngularConstructOrPlainFile,
    selectedUri: vscode.Uri
  ): Promise<boolean> {
    try {
      const resolvedUri = await this.resolveSelectedUri(construct, selectedUri);
      if (!resolvedUri) {
        return false;
      }

      await this.initializeContext(resolvedUri, construct);

      if (!(await this.validateAndGetUserInput())) {
        return false;
      }

      await this.waitForIndexer();
      this.logRenameDetails();

      return true;
    } catch (error: any) {
      console.warn('prepareRenameDetails error: ', error);
      this.debugLogger.log(
        'prepareRenameDetails error: ',
        JSON.stringify(error, Object.getOwnPropertyNames(error))
      );
      return false;
    }
  }

  private async resolveSelectedUri(
    construct: AngularConstructOrPlainFile,
    selectedUri: vscode.Uri
  ): Promise<vscode.Uri | null> {
    if (!selectedUri) {
      const userEntered = await noSelectedFileHandler(
        construct,
        this.context.title!,
        this.userMessage
      );
      return userEntered || null;
    }
    return selectedUri;
  }

  private async initializeContext(
    selectedUri: vscode.Uri,
    construct: AngularConstructOrPlainFile
  ): Promise<void> {
    this.context.originalFileDetails = getOriginalFileDetails(selectedUri.path);
    this.context.projectRoot = windowsFilePathFix(
      getProjectRoot(selectedUri) as string
    );
    this.debugLogger.setWorkspaceRoot(this.context.projectRoot);

    this.context.filesRelatedToStub = await FilesRelatedToStub.init(
      this.context.originalFileDetails!,
      this.context.projectRoot!,
      construct
    );

    this.context.construct = this.context.filesRelatedToStub!.derivedConstruct;
    this.context.title = `Rename ${
      this.context.construct
        ? `Angular ${classify(this.context.construct)}`
        : 'file'
    }`;
  }

  private async validateAndGetUserInput(): Promise<boolean> {
    if (checkForOpenUnsavedEditors()) {
      this.userMessage.popupMessage(
        `Please save any edits before using ${this.context.title}`
      );
      return false;
    }

    const userInput = await this.getUserInput();
    if (!userInput) {
      return false;
    }

    if (!this.validateUserInput(userInput)) {
      return false;
    }

    this.context.newFilenameInput = removeExtension(userInput);
    this.context.processTimerStart = Date.now();
    this.context.newStub = getNewStubFromFileWithoutExtension(
      this.context.newFilenameInput
    );

    if (!this.validateSelector()) {
      return false;
    }

    this.userMessage.setOperationTitle(this.context.title!);
    return true;
  }

  private async getUserInput(): Promise<string | undefined> {
    const inputSuffixNote = this.getInputSuffixNote();
    const unrecognisedDefinitionMessage =
      this.getUnrecognisedDefinitionWarning();
    const constructText = this.context.construct
      ? `${this.context.construct} `
      : '';

    return (
      this.testBypass?.newFilenameInput ??
      (await vscode.window.showInputBox({
        title: this.context.title,
        prompt: `Enter the new ${constructText}filename. ${inputSuffixNote} ${unrecognisedDefinitionMessage}`,
        value: this.context.originalFileDetails!.fileWithoutType,
      }))
    );
  }

  private getInputSuffixNote(): string {
    return !!this.context.construct &&
      this.context.originalFileDetails!.fileWithoutType.endsWith(
        `.${this.context.construct}`
      )
      ? `(Angular '.${this.context.construct}' suffix is optional)`
      : '';
  }

  private getUnrecognisedDefinitionWarning(): string {
    const unrecognisedDefinition =
      !this.context.filesRelatedToStub?.definitionType;

    return unrecognisedDefinition
      ? `This extension currently only supports renaming classes, functions, variables, interfaces, and enums
          that have the same name as the file they are in. In this case, I can only rename the file, not any definition in the file.`
      : '';
  }

  private validateUserInput(userInput: string): boolean {
    if (!userInput) {
      this.userMessage.popupMessage(
        `New ${this.context.construct} name not entered. Stopped.`
      );
      return false;
    }

    if (this.context.originalFileDetails!.fileWithoutType === userInput) {
      this.userMessage.popupMessage(
        `${classify(
          this.context.construct ?? 'New file'
        )} name same as original. Stopped.`
      );
      return false;
    }

    return true;
  }

  private validateSelector(): boolean {
    if (!validateHtmlSelector('app-' + dasherize(this.context.newStub!))) {
      this.userMessage.popupMessage(
        `Please enter a name that formats to a valid Selector name (W3C standards). \n
        Must start name with a letter, then letters, numbers, full stop, dash or underscore, ending with a letter or number.`
      );
      return false;
    }
    return true;
  }

  private async waitForIndexer(): Promise<void> {
    const indexTime = await this.indexerInitialisePromise;
    this.userMessage.logInfoToChannel(
      [
        `Index files completed in ${Math.round(indexTime * 100) / 100} seconds`,
        '',
      ],
      false
    );
  }

  private logRenameDetails(): void {
    this.debugLogger.log(
      'projectRoot: ' + this.context.projectRoot,
      '',
      'originalFileDetails:',
      JSON.stringify(this.context.originalFileDetails),
      '',
      'inputResult: ' + this.context.newFilenameInput,
      '',
      'newStub: ' + this.context.newStub
    );
  }
}
