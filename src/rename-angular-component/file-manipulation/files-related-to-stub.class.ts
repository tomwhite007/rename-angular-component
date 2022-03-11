import { workspace } from 'vscode';
import { escapeRegex } from '../../utils/escape-regex';
import { likeFilesRegexPartialLookup } from '../definitions/file-regex.constants';
import {
  OriginalFileDetails,
  AngularConstruct,
} from '../definitions/file.interfaces';
import { windowsFilePathFix } from './windows-file-path-fix.function';

interface FileDetails {
  filePath: string;
  sameConstruct: boolean;
  sameStub: boolean;
  isCoreConstruct: boolean;
}

export class FilesRelatedToStub {
  originalFileDetails!: OriginalFileDetails;
  folderNameSameAsStub = false;
  fileDetails: FileDetails[] = [];
  constructFilesRegex!: RegExp;
  relatedFilesRegex!: RegExp;

  static async init(
    fileDetails: OriginalFileDetails,
    projectRoot: string,
    construct: AngularConstruct
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
    construct: AngularConstruct
  ) {
    this.originalFileDetails = fileDetails;

    if (fileDetails.path.endsWith(fileDetails.stub)) {
      this.folderNameSameAsStub = true;
    }

    const glob = `${fileDetails.path.replace(projectRoot + '/', '')}/**/*`;
    const uris = await workspace.findFiles(glob, '**/node_modules/**', 10000);

    this.constructFilesRegex = RegExp(
      `${escapeRegex(fileDetails.stub)}${
        likeFilesRegexPartialLookup[construct]
      }`
    );
    this.relatedFilesRegex = new RegExp(
      `${escapeRegex(fileDetails.stub)}${likeFilesRegexPartialLookup.any}`
    );

    const isCoreConstructRegex = new RegExp(`\\.${construct}\\.ts$`);

    uris.forEach((uri) => {
      const filePath = windowsFilePathFix(uri.fsPath);
      this.fileDetails.push({
        filePath,
        sameConstruct: !!filePath.match(this.constructFilesRegex),
        sameStub: !!filePath.match(this.relatedFilesRegex),
        isCoreConstruct: !!filePath.match(isCoreConstructRegex),
      });
    });
  }

  getFilesToMove(newStub: string) {
    const folderReplaceRegex = new RegExp(
      `(?<=\/)${escapeRegex(this.originalFileDetails.stub)}$`
    );
    const replaceStub = (filePath: string) => {
      if (this.folderNameSameAsStub) {
        filePath = filePath.replace(
          this.originalFileDetails.path,
          this.originalFileDetails.path.replace(folderReplaceRegex, newStub)
        );
      }
      return filePath.replace(this.constructFilesRegex, newStub);
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
