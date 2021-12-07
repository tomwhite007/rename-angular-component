import escapeStringRegexp from 'escape-string-regexp';
import { workspace } from 'vscode';
import { likeFilesRegexPartialLookup } from './definitions/file-regex.constants';
import {
  OriginalFileDetails,
  AngularConstruct,
} from './definitions/file.interfaces';
import { windowsFilePathFix } from './fileManipulation/windows-file-path-fix.function';

export class FilesRelatedToStub {
  originalFileDetails!: OriginalFileDetails;
  folderNameSameAsStub = false;
  fileDetails: {
    filePath: string;
    sameConstruct: boolean;
    sameStub: boolean;
    isCoreConstruct: boolean;
  }[] = [];
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
      `${escapeStringRegexp(fileDetails.stub)}${
        likeFilesRegexPartialLookup[construct]
      }`
    );
    this.relatedFilesRegex = new RegExp(
      `${escapeStringRegexp(fileDetails.stub)}${
        likeFilesRegexPartialLookup.any
      }`
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
      `(?<=\/)${escapeStringRegexp(this.originalFileDetails.stub)}$`
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
      .map((fd) => ({
        filePath: fd.filePath,
        newFilePath: replaceStub(fd.filePath),
        isCoreConstruct: fd.isCoreConstruct,
      }));
  }
}
