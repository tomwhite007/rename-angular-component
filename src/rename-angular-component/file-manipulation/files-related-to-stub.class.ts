import { basename, dirname, join } from 'path';
import { workspace } from 'vscode';
import { conf } from '../../move-ts-indexer/util/helper-functions';
import { escapeRegex } from '../../utils/escape-regex';
import {
  likeFilesRegexPartialLookup,
  tsFileButNotSpec,
} from '../definitions/file-regex.constants';
import {
  AngularConstructOrPlainFile,
  DefinitionType,
  OriginalFileDetails,
} from '../definitions/file.interfaces';
import { getConstructFromDecorator } from '../in-file-edits/get-construct-from-decorator.function';
import { getCoreFileDefinitionDetails } from '../in-file-edits/get-core-file-definition-details.function';
import { windowsFilePathFix } from './windows-file-path-fix.function';

interface FileDetails {
  filePath: string;
  sameConstruct: boolean;
  sameStub: boolean;
  isCoreConstruct: boolean;
}

export interface FileToMove {
  filePath: string;
  newFilePath: string;
  isCoreConstruct: boolean;
}

export class FilesRelatedToStub {
  originalFileDetails!: OriginalFileDetails;
  folderNameSameAsStub = false;
  newFolderPath?: string;
  fileDetails: FileDetails[] = [];
  constructFilesRegex!: RegExp;
  relatedFilesRegex!: RegExp;
  derivedConstruct: AngularConstructOrPlainFile | null = null;
  originalDefinitionName?: string;
  definitionType: DefinitionType = null;

  static async init(
    fileDetails: OriginalFileDetails,
    projectRoot: string,
    construct: AngularConstructOrPlainFile
  ) {
    const instance = new FilesRelatedToStub();
    await instance.catalogueFilesInCurrentFolder(
      fileDetails,
      projectRoot,
      construct
    );
    return instance;
  }

  private async catalogueFilesInCurrentFolder(
    fileDetails: OriginalFileDetails,
    projectRoot: string,
    construct: AngularConstructOrPlainFile
  ) {
    this.originalFileDetails = fileDetails;

    const folderName = basename(fileDetails.path);
    if (
      folderName === fileDetails.stub ||
      folderName === fileDetails.fileWithoutType
    ) {
      this.folderNameSameAsStub = true;
    }

    const glob = `${fileDetails.path.replace(projectRoot + '/', '')}/**/*`;
    const uris = await workspace.findFiles(glob, '**/node_modules/**', 10000);

    this.constructFilesRegex = RegExp(
      `${escapeRegex(fileDetails.fileWithoutType)}${
        likeFilesRegexPartialLookup[construct]
      }`
    );
    this.relatedFilesRegex = new RegExp(
      `${escapeRegex(fileDetails.stub)}${likeFilesRegexPartialLookup.any}`
    );

    for (const uri of uris) {
      const filePath = windowsFilePathFix(uri.fsPath);
      const sameConstruct = !!filePath.match(this.constructFilesRegex);
      const sameStub = !!filePath.match(this.relatedFilesRegex);
      const isTsFileButNotSpec = !!filePath.match(tsFileButNotSpec);

      if (sameConstruct && sameStub && isTsFileButNotSpec) {
        this.derivedConstruct = await this.deriveConstructFromFileContent(
          filePath,
          fileDetails.stub
        );
      }

      this.fileDetails.push({
        filePath,
        sameConstruct,
        sameStub,
        isCoreConstruct:
          sameConstruct &&
          sameStub &&
          isTsFileButNotSpec &&
          !!this.derivedConstruct,
      });
    }
  }

  getFilesToMove(newStub: string, newFilenameInput: string) {
    const replaceStub = (filePath: string) => {
      if (this.folderNameSameAsStub) {
        const newFolderName = conf(
          'followAngular20+FolderNamingConvention',
          true
        )
          ? newFilenameInput
          : newStub;
        const parentPath = dirname(this.originalFileDetails.path);
        this.newFolderPath = join(parentPath, newFolderName);
        filePath = filePath.replace(
          this.originalFileDetails.path,
          this.newFolderPath
        );
      }
      return filePath.replace(this.constructFilesRegex, newFilenameInput);
    };

    return this.fileDetails
      .filter((fd) => this.folderNameSameAsStub || fd.sameConstruct)
      .sort(this.sortFileDetails)
      .map((fd) => ({
        filePath: fd.filePath,
        newFilePath: replaceStub(fd.filePath),
        isCoreConstruct: fd.isCoreConstruct,
      }));
  }

  async deriveConstructFromFileContent(
    filePath: string,
    stub: string
  ): Promise<AngularConstructOrPlainFile | null> {
    const coreFileDefinitionDetails = await getCoreFileDefinitionDetails(
      filePath,
      stub
    );
    if (!coreFileDefinitionDetails) {
      return null;
    }
    const { decoratorName, definitionType, definitionName } =
      coreFileDefinitionDetails;
    this.originalDefinitionName = definitionName;
    this.definitionType = definitionType;
    return getConstructFromDecorator(decoratorName, definitionType);
  }

  private sortFileDetails(a: FileDetails, b: FileDetails) {
    if (a.isCoreConstruct && a.sameConstruct) {
      return -1;
    }
    if (b.isCoreConstruct && b.sameConstruct) {
      return 1;
    }

    if (a.sameConstruct) {
      return -1;
    }
    if (b.sameConstruct) {
      return 1;
    }

    if (a.sameStub) {
      return -1;
    }
    if (b.sameStub) {
      return 1;
    }

    if (a.filePath > b.filePath) {
      return -1;
    }
    if (b.filePath > a.filePath) {
      return 1;
    }

    return 0;
  }
}
