const expect = require('chai').expect;
import fs from 'fs-extra-promise';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';
import vscode, { workspace, WorkspaceConfiguration } from 'vscode';
import { OriginalFileDetails } from '../../../rename-angular-component/definitions/file.interfaces';
import { FilesRelatedToStub } from '../../../rename-angular-component/file-manipulation/files-related-to-stub.class';

const stubGetConfiguration = (enabled: boolean) =>
  sinon.stub(workspace, 'getConfiguration').returns({
    get: (property: string) => {
      return enabled;
    },
  } as WorkspaceConfiguration);

const componentFileContent = `
  @Component({
    selector: 'app-component',
    template: 'test',
  })
  export class ComponentComponent {}
`;
describe('FilesRelatedToStub', () => {
  let sandbox: sinon.SinonSandbox;
  let workspaceFindFilesStub: sinon.SinonStub;
  let readFileStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    readFileStub = sandbox.stub(fs, 'readFileAsync');
    workspaceFindFilesStub = sandbox.stub(vscode.workspace, 'findFiles');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('init', () => {
    it('should initialize FilesRelatedToStub with correct file details', async () => {
      const fileDetails: OriginalFileDetails = {
        path: '/project/src/app/component',
        stub: 'component',
        fileWithoutType: 'component.component',
        filePath: '/project/src/app/component/component.component.ts',
        file: 'component.component.ts',
      };

      const mockUris = [
        { fsPath: '/project/src/app/component/component.component.ts' },
        { fsPath: '/project/src/app/component/component.html' },
        { fsPath: '/project/src/app/component/component.spec.ts' },
      ];

      workspaceFindFilesStub.resolves(mockUris);
      readFileStub.resolves(componentFileContent);

      const instance = await FilesRelatedToStub.init(
        fileDetails,
        '/project',
        'component'
      );

      expect(instance.originalFileDetails).to.deep.equal(fileDetails);
      expect(instance.folderNameSameAsStub).to.be.true;
      expect(instance.fileDetails).to.have.length(3);
    });
  });

  describe('getFilesToMove', () => {
    describe('with Angular 20+ folder naming convention', () => {
      before(() => {
        stubGetConfiguration(true);
      });

      after(() => {
        sinon.restore();
      });
      it('should return correct file paths to move when folder name matches stub', async () => {
        const fileDetails: OriginalFileDetails = {
          path: '/project/src/app/component',
          stub: 'component',
          fileWithoutType: 'component.component',
          filePath: '/project/src/app/component/component.component.ts',
          file: 'component.component.ts',
        };

        const mockUris = [
          { fsPath: '/project/src/app/component/component.component.ts' },
          { fsPath: '/project/src/app/component/component.html' },
        ];

        workspaceFindFilesStub.resolves(mockUris);
        readFileStub.resolves(componentFileContent);

        const instance = await FilesRelatedToStub.init(
          fileDetails,
          '/project',
          'component'
        );
        const filesToMove = instance.getFilesToMove(
          'new-component',
          'new-component.component'
        );

        expect(filesToMove).to.have.length(2);
        expect(filesToMove[0].filePath).to.equal(
          '/project/src/app/component/component.component.ts'
        );
        expect(filesToMove[0].newFilePath).to.equal(
          '/project/src/app/new-component.component/new-component.component.ts'
        );
        expect(filesToMove[0].isCoreConstruct).to.be.true;
      });

      it('should return correct file paths to move when folder name does not match stub', async () => {
        const fileDetails: OriginalFileDetails = {
          path: '/project/src/app/feature',
          stub: 'component',
          fileWithoutType: 'component.component',
          filePath: '/project/src/app/feature/component.component.ts',
          file: 'component.component.ts',
        };

        const mockUris = [
          { fsPath: '/project/src/app/feature/component.component.ts' },
          { fsPath: '/project/src/app/feature/test.ts' },
        ];

        workspaceFindFilesStub.resolves(mockUris);
        readFileStub.resolves(componentFileContent);

        const instance = await FilesRelatedToStub.init(
          fileDetails,
          '/project',
          'component'
        );
        const filesToMove = instance.getFilesToMove(
          'new-component',
          'new-component.component'
        );

        expect(filesToMove).to.deep.equal([
          {
            filePath: '/project/src/app/feature/component.component.ts',
            newFilePath: '/project/src/app/feature/new-component.component.ts',
            isCoreConstruct: true,
          },
        ]);
      });
    });

    describe('without Angular 20+ folder naming convention', () => {
      before(() => {
        stubGetConfiguration(false);
      });

      after(() => {
        sinon.restore();
      });
      it('should return correct file paths to move when folder name matches stub', async () => {
        const fileDetails: OriginalFileDetails = {
          path: '/project/src/app/component',
          stub: 'component',
          fileWithoutType: 'component.component',
          filePath: '/project/src/app/component/component.component.ts',
          file: 'component.component.ts',
        };

        const mockUris = [
          { fsPath: '/project/src/app/component/component.component.ts' },
          { fsPath: '/project/src/app/component/component.html' },
        ];

        workspaceFindFilesStub.resolves(mockUris);
        readFileStub.resolves(componentFileContent);

        const instance = await FilesRelatedToStub.init(
          fileDetails,
          '/project',
          'component'
        );
        const filesToMove = instance.getFilesToMove(
          'new-component',
          'new-component.component'
        );

        expect(filesToMove).to.have.length(2);
        expect(filesToMove[0].filePath).to.equal(
          '/project/src/app/component/component.component.ts'
        );
        expect(filesToMove[0].newFilePath).to.equal(
          '/project/src/app/new-component/new-component.component.ts'
        );
        expect(filesToMove[0].isCoreConstruct).to.be.true;
      });

      it('should return correct file paths to move when folder name does not match stub', async () => {
        const fileDetails: OriginalFileDetails = {
          path: '/project/src/app/feature',
          stub: 'component',
          fileWithoutType: 'component.component',
          filePath: '/project/src/app/feature/component.component.ts',
          file: 'component.component.ts',
        };

        const mockUris = [
          { fsPath: '/project/src/app/feature/component.component.ts' },
          { fsPath: '/project/src/app/feature/test.ts' },
        ];

        workspaceFindFilesStub.resolves(mockUris);
        readFileStub.resolves(componentFileContent);

        const instance = await FilesRelatedToStub.init(
          fileDetails,
          '/project',
          'component'
        );
        const filesToMove = instance.getFilesToMove(
          'new-component',
          'new-component.component'
        );

        expect(filesToMove).to.deep.equal([
          {
            filePath: '/project/src/app/feature/component.component.ts',
            newFilePath: '/project/src/app/feature/new-component.component.ts',
            isCoreConstruct: true,
          },
        ]);
      });
    });
  });

  describe('sortFileDetails', () => {
    it('should sort files with core construct first', async () => {
      const fileDetails: OriginalFileDetails = {
        path: '/project/src/app/component',
        stub: 'component',
        fileWithoutType: 'component.component',
        filePath: '/project/src/app/component/component.component.ts',
        file: 'component.component.ts',
      };

      const mockUris = [
        { fsPath: '/project/src/app/component/component.html' },
        { fsPath: '/project/src/app/component/component.component.ts' },
        { fsPath: '/project/src/app/component/component.spec.ts' },
      ];

      workspaceFindFilesStub.resolves(mockUris);
      readFileStub.resolves(componentFileContent);

      const instance = await FilesRelatedToStub.init(
        fileDetails,
        '/project',
        'component'
      );
      const filesToMove = instance.getFilesToMove(
        'new-component',
        'new-component.component'
      );

      expect(filesToMove[0].filePath).to.equal(
        '/project/src/app/component/component.component.ts'
      );
      expect(filesToMove[0].isCoreConstruct).to.be.true;
    });
  });
});
