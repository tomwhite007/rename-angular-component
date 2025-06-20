import fs from 'fs-extra-promise';
import path from 'path';
import vscode from 'vscode';
import { classify, dasherize } from '../angular-cli/strings';
import { validateHtmlSelector } from '../angular-cli/validation';
import { FileItem } from '../move-ts-indexer/file-item';
import { timeoutPause } from '../utils/timeout-pause';
import {
  AngularConstructOrPlainFile,
  OriginalFileDetails,
} from './definitions/file.interfaces';
import { getProjectRoot } from './definitions/get-project-root-file-path.function';
import { FileMoveHandler } from './file-manipulation/file-move-handler.class';
import { FilesRelatedToStub } from './file-manipulation/files-related-to-stub.class';
import { updateSelectorsInTemplates } from './file-manipulation/selector-update-handler.function';
import { windowsFilePathFix } from './file-manipulation/windows-file-path-fix.function';
import {
  getAngularCoreClassEdits,
  getClassNameEdits,
  SelectorTransfer,
} from './in-file-edits/custom-edits';
import { getCoreFilePath } from './in-file-edits/get-core-file-path.function';
import { getNewDefinitionName } from './in-file-edits/get-new-definition-name.function';
import { getNewStubFromFileWithoutExtension } from './in-file-edits/get-new-stub-from-file-without-extension';
import { getOriginalFileDetails } from './in-file-edits/get-original-file-details.function';
import { removeExtension } from './in-file-edits/remove-extension';
import { DebugLogger } from './logging/debug-logger.class';
import { reportErrors } from './logging/error-handler.function';
import { UserMessage } from './logging/user-message.class';
import { noSelectedFileHandler } from './no-selected-file-handler/no-selected-file-handler.function';
import { checkForOpenUnsavedEditors } from './window/check-for-open-unsaved-editors.function';

export class Renamer {
  private construct: AngularConstructOrPlainFile | null = null; // will be set to 'file' if not an Angular construct
  private title!: string;
  private originalFileDetails!: Readonly<OriginalFileDetails>;
  private filesRelatedToStub?: FilesRelatedToStub;
  private projectRoot!: string;
  private newStub!: string;
  private newFilenameInput!: string;
  private processTimerStart!: number;
  private renameFolder!: boolean;
  private fileMoveJobs!: FileItem[];
  private selectorTransfer!: SelectorTransfer;
  public testBypass?: { newFilenameInput: string };

  constructor(
    private indexerInitialisePromise: Thenable<any>,
    private userMessage: UserMessage,
    private debugLogger: DebugLogger,
    private fileMoveHandler: FileMoveHandler
  ) {}

  async rename(
    _construct: AngularConstructOrPlainFile,
    selectedUri: vscode.Uri
  ) {
    this.debugLogger.logToConsole('## Debug Rename Start ##');

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

          await this.fileMoveHandler.runFileMoveJobs(
            this.fileMoveJobs,
            progress
          );

          await updateSelectorsInTemplates(
            this.construct,
            this.selectorTransfer,
            this.userMessage,
            this.debugLogger
          );

          // delete original folder
          if (this.renameFolder) {
            fs.remove(this.originalFileDetails.path);
          }

          const unrecognisedDefinition =
            !this.filesRelatedToStub?.definitionType;
          const unrecognisedDefinitionMessage = unrecognisedDefinition
            ? [
                '',
                `This extension currently only supports renaming classes, functions, variables, interfaces, and enums that have the same name as the file they are in.`,
                `In this case, I could only rename the file, not any definition in the file.`,
              ]
            : [];

          // report process completed
          progress.report({ increment: 100 });
          const renameTime =
            Math.round((Date.now() - this.processTimerStart) / 10) / 100;
          this.userMessage.logInfoToChannel([
            ...unrecognisedDefinitionMessage,
            '',
            `${this.title} completed in ${renameTime} seconds`,
          ]);

          this.debugLogger.log('## Debug Rename Completed ##');

          await timeoutPause(50);
          console.log('Rename process end');
        } catch (e: any) {
          reportErrors(e, this.title, this.userMessage, this.debugLogger);
          console.log('Rename process ended with errors', e);
        }
      }
    );
  }

  private async prepFileMoveJobs(): Promise<boolean> {
    if (!this.filesRelatedToStub) {
      this.debugLogger.log('filesRelatedToStub is not set, stopping.');
      return false;
    }

    this.debugLogger.log(
      'find related glob: ',
      `${this.originalFileDetails.path.replace(
        this.projectRoot + '/',
        ''
      )}/**/*`
    );

    this.renameFolder =
      this.filesRelatedToStub.folderNameSameAsStub &&
      this.originalFileDetails.stub !== this.newStub; // makes sure construct suffix is not the only thing being changed

    const filesToMove = this.filesRelatedToStub.getFilesToMove(
      this.newStub,
      this.newFilenameInput
    );

    this.debugLogger.log(
      'renameFolder: ' + this.renameFolder,
      '',
      'filesToMove: ',
      JSON.stringify(filesToMove)
    );

    // if (!filesToMove.some((f) => f.isCoreConstruct)) {
    //   const errMsg = `The ${this.construct} class file must use the same file naming convention as '${this.originalFileDetails.file}' for this process to run.`;
    //   this.userMessage.popupMessage(errMsg);
    //   this.debugLogger.log(errMsg);
    //   return false;
    // }

    const coreFilePath = getCoreFilePath(filesToMove);
    const oldClassName = this.filesRelatedToStub.originalDefinitionName!;
    const newClassName = getNewDefinitionName(
      this.newStub,
      this.newFilenameInput,
      this.construct,
      this.filesRelatedToStub.definitionType
    );

    this.selectorTransfer = new SelectorTransfer();

    this.fileMoveJobs = filesToMove.map((f) => {
      const additionalEdits = {
        importsEdits:
          path.extname(f.filePath) === '.ts'
            ? (() => getClassNameEdits(oldClassName, newClassName))()
            : undefined,
        movedFileEdits: f.isCoreConstruct
          ? (() =>
              getAngularCoreClassEdits(
                oldClassName,
                newClassName,
                this.originalFileDetails.stub,
                this.newStub,
                this.newFilenameInput,
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

    if (
      this.fileMoveJobs.some((l) => l.sourcePath !== l.targetPath && l.exists())
    ) {
      vscode.window.showErrorMessage('Not allowed to overwrite existing files');

      this.debugLogger.logToConsole(
        'l.exists(): Not allowed to overwrite existing files'
      );

      return false;
    }
    return true;
  }

  private async prepRenameDetails(
    _construct: AngularConstructOrPlainFile,
    selectedUri: vscode.Uri
  ): Promise<boolean> {
    try {
      // Handle if called from command menu
      if (!selectedUri) {
        const userEntered = await noSelectedFileHandler(
          _construct,
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

      this.filesRelatedToStub = await FilesRelatedToStub.init(
        this.originalFileDetails,
        this.projectRoot,
        _construct
      );

      this.construct = this.filesRelatedToStub.derivedConstruct;
      this.title = `Rename ${
        this.construct ? `Angular ${classify(this.construct)}` : 'file'
      }`;

      if (checkForOpenUnsavedEditors()) {
        this.userMessage.popupMessage(
          `Please save any edits before using ${this.title}`
        );
        return false;
      }

      const inputSuffixNote =
        !!this.construct &&
        this.originalFileDetails.fileWithoutType.endsWith(`.${this.construct}`)
          ? `(Angular '.${this.construct}' suffix is optional)`
          : '';

      const unrecognisedDefinition = !this.filesRelatedToStub?.definitionType;
      const unrecognisedDefinitionMessage = unrecognisedDefinition
        ? `This extension currently only supports renaming classes, functions, variables, interfaces, and enums
          that have the same name as the file they are in. In this case, I can only rename the file, not any definition in the file.`
        : '';

      const constructText = this.construct ? `${this.construct} ` : '';

      this.newFilenameInput =
        this.testBypass?.newFilenameInput ?? // test harness input text
        (await vscode.window.showInputBox({
          title: this.title,
          prompt: `Enter the new ${constructText}filename. ${inputSuffixNote} ${unrecognisedDefinitionMessage}`,
          value: this.originalFileDetails.fileWithoutType,
        })) ??
        '';
      this.newFilenameInput = removeExtension(this.newFilenameInput); // remove extension if any
      this.processTimerStart = Date.now();

      if (!this.newFilenameInput) {
        this.userMessage.popupMessage(
          `New ${this.construct} name not entered. Stopped.`
        );
        return false;
      }
      if (this.originalFileDetails.fileWithoutType === this.newFilenameInput) {
        this.userMessage.popupMessage(
          `${classify(
            this.construct ?? 'New file'
          )} name same as original. Stopped.`
        );
        return false;
      }

      this.newStub = getNewStubFromFileWithoutExtension(this.newFilenameInput);
      if (!validateHtmlSelector('app-' + dasherize(this.newStub))) {
        this.userMessage.popupMessage(
          `Please enter a name that formats to a valid Selector name (W3C standards). \n
          Must start name with a letter, then letters, numbers, full stop, dash or underscore, ending with a letter or number.`
        );
        return false;
      }

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
        'inputResult: ' + this.newFilenameInput,
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
