import * as fs from 'fs';
import { afterEach, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';
import AngularFileSuffixRemover from '../../../rename-angular-component/suffix-removal/tools/remove-angular-suffixes';

const expect = require('chai').expect;

describe('AngularFileSuffixRemover', () => {
  let sandbox: sinon.SinonSandbox;
  let mockUserMessage: any;
  let remover: AngularFileSuffixRemover;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockUserMessage = {
      logInfoToChannel: sandbox.stub(),
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Constructor', () => {
    it('should initialize with correct default values', () => {
      remover = new AngularFileSuffixRemover('component');

      expect(remover['suffix']).to.equal('component');
      expect(remover['dryRun']).to.equal(false);
      expect(remover['projectRoot']).to.equal(process.cwd());
      expect(remover['userMessage']).to.be.undefined;
      expect(remover['exclusionPrefixes']).to.deep.equal([]);
      expect(remover.changes).to.deep.equal([]);
    });

    it('should initialize with custom values', () => {
      const exclusionPrefixes = ['profile.component', 'user.service'];

      remover = new AngularFileSuffixRemover(
        'service',
        true,
        mockUserMessage,
        exclusionPrefixes
      );

      expect(remover['suffix']).to.equal('service');
      expect(remover['dryRun']).to.equal(true);
      expect(remover['userMessage']).to.equal(mockUserMessage);
      expect(remover['exclusionPrefixes']).to.deep.equal(exclusionPrefixes);
    });
  });

  describe('removeFileExtension', () => {
    beforeEach(() => {
      remover = new AngularFileSuffixRemover('component');
    });

    it('should remove .ts extension', () => {
      const result = remover['removeFileExtension']('profile.component.ts');
      expect(result).to.equal('profile.component');
    });

    it('should remove .js extension', () => {
      const result = remover['removeFileExtension']('profile.component.js');
      expect(result).to.equal('profile.component');
    });

    it('should remove .html extension', () => {
      const result = remover['removeFileExtension']('profile.component.html');
      expect(result).to.equal('profile.component');
    });

    it.skip('should remove .spec.ts extension', () => {
      const result = remover['removeFileExtension'](
        'profile.component.spec.ts'
      );
      expect(result).to.equal('profile.component');
    });

    it('should preserve filename without recognized extensions', () => {
      const result = remover['removeFileExtension']('profile.component');
      expect(result).to.equal('profile.component');
    });

    it('should handle case insensitive extensions', () => {
      const result = remover['removeFileExtension']('profile.component.TS');
      expect(result).to.equal('profile.component');
    });
  });

  describe('shouldExcludeFile', () => {
    beforeEach(() => {
      remover = new AngularFileSuffixRemover('component');
    });

    it('should not exclude files when no exclusion prefixes', () => {
      const result = remover['shouldExcludeFile'](
        '/path/to/profile.component.ts'
      );
      expect(result).to.be.false;
    });

    it('should exclude files with exact pattern match', () => {
      remover['exclusionPrefixes'] = ['profile.component'];

      const result = remover['shouldExcludeFile'](
        '/path/to/profile.component.ts'
      );
      expect(result).to.be.true;
    });

    it('should not exclude files with similar but not exact pattern', () => {
      remover['exclusionPrefixes'] = ['profile.component'];

      const result = remover['shouldExcludeFile'](
        '/path/to/profile-details.component.ts'
      );
      expect(result).to.be.false;
    });

    it('should exclude files with prefix match (backward compatibility)', () => {
      remover['exclusionPrefixes'] = ['profile'];

      const result = remover['shouldExcludeFile'](
        '/path/to/profile.component.ts'
      );
      expect(result).to.be.true;
    });

    it('should handle case insensitive matching', () => {
      remover['exclusionPrefixes'] = ['PROFILE.COMPONENT'];

      const result = remover['shouldExcludeFile'](
        '/path/to/profile.component.ts'
      );
      expect(result).to.be.true;
    });

    it('should handle multiple exclusion patterns', () => {
      remover['exclusionPrefixes'] = ['profile.component', 'user.service'];

      expect(remover['shouldExcludeFile']('/path/to/profile.component.ts')).to
        .be.true;
      expect(remover['shouldExcludeFile']('/path/to/user.service.ts')).to.be
        .true;
      expect(remover['shouldExcludeFile']('/path/to/customer.component.ts')).to
        .be.false;
    });
  });

  describe('shouldExcludeImportPath', () => {
    beforeEach(() => {
      remover = new AngularFileSuffixRemover('component');
    });

    it('should not exclude import paths when no exclusion prefixes', () => {
      const result = remover['shouldExcludeImportPath']('./profile.component');
      expect(result).to.be.false;
    });

    it('should exclude import paths with exact pattern match', () => {
      remover['exclusionPrefixes'] = ['profile.component'];

      const result = remover['shouldExcludeImportPath']('./profile.component');
      expect(result).to.be.true;
    });

    it('should exclude import paths with file extensions', () => {
      remover['exclusionPrefixes'] = ['profile.component'];

      const result = remover['shouldExcludeImportPath'](
        './profile.component.ts'
      );
      expect(result).to.be.true;
    });

    it('should not exclude similar but not exact import paths', () => {
      remover['exclusionPrefixes'] = ['profile.component'];

      const result = remover['shouldExcludeImportPath'](
        './profile-details.component'
      );
      expect(result).to.be.false;
    });

    it('should handle nested import paths', () => {
      remover['exclusionPrefixes'] = ['profile.component'];

      const result = remover['shouldExcludeImportPath'](
        './components/profile/profile.component'
      );
      expect(result).to.be.true;
    });
  });

  describe('hasSuffix', () => {
    beforeEach(() => {
      remover = new AngularFileSuffixRemover('component');
    });

    it('should return true for files with the specified suffix', () => {
      expect(remover['hasSuffix']('profile.component.ts')).to.be.true;
      expect(remover['hasSuffix']('profile.component.html')).to.be.true;
      expect(remover['hasSuffix']('profile.component.spec.ts')).to.be.true;
    });

    it('should return false for files without the specified suffix', () => {
      expect(remover['hasSuffix']('profile.service.ts')).to.be.false;
      expect(remover['hasSuffix']('profile.directive.ts')).to.be.false;
    });

    it('should work with different suffixes', () => {
      remover = new AngularFileSuffixRemover('service');

      expect(remover['hasSuffix']('profile.service.ts')).to.be.true;
      expect(remover['hasSuffix']('profile.component.ts')).to.be.false;
    });
  });

  describe('extractClassName', () => {
    beforeEach(() => {
      remover = new AngularFileSuffixRemover('component');
    });

    it.skip('should extract class name from regular export', () => {
      const content = 'export class MyComponent { }';

      // Mock fs.readFileSync using Object.defineProperty
      const originalReadFileSync = fs.readFileSync;
      const mockReadFileSync = sandbox.stub().returns(content);
      Object.defineProperty(fs, 'readFileSync', {
        value: mockReadFileSync,
        writable: true,
        configurable: true,
      });

      const result = remover['extractClassName']('dummy-path.ts');

      expect(result).to.not.be.null;
      expect(result!.className).to.equal('MyComponent');
      expect(result!.newClassName).to.equal('My');
      expect(result!.isClass).to.be.true;

      // Restore original function
      Object.defineProperty(fs, 'readFileSync', {
        value: originalReadFileSync,
        writable: true,
        configurable: true,
      });
    });

    it.skip('should extract class name from export default', () => {
      const content = 'export default class MyComponent { }';

      const originalReadFileSync = fs.readFileSync;
      const mockReadFileSync = sandbox.stub().returns(content);
      Object.defineProperty(fs, 'readFileSync', {
        value: mockReadFileSync,
        writable: true,
        configurable: true,
      });

      const result = remover['extractClassName']('dummy-path.ts');

      expect(result).to.not.be.null;
      expect(result!.className).to.equal('MyComponent');
      expect(result!.newClassName).to.equal('My');
      expect(result!.isClass).to.be.true;

      // Restore original function
      Object.defineProperty(fs, 'readFileSync', {
        value: originalReadFileSync,
        writable: true,
        configurable: true,
      });
    });

    it.skip('should handle export default with whitespace', () => {
      const content = 'export   default   class   MyComponent   { }';

      const originalReadFileSync = fs.readFileSync;
      const mockReadFileSync = sandbox.stub().returns(content);
      Object.defineProperty(fs, 'readFileSync', {
        value: mockReadFileSync,
        writable: true,
        configurable: true,
      });

      const result = remover['extractClassName']('dummy-path.ts');

      expect(result).to.not.be.null;
      expect(result!.className).to.equal('MyComponent');
      expect(result!.newClassName).to.equal('My');
      expect(result!.isClass).to.be.true;

      // Restore original function
      Object.defineProperty(fs, 'readFileSync', {
        value: originalReadFileSync,
        writable: true,
        configurable: true,
      });
    });

    it('should return null for class files (no name change)', () => {
      remover = new AngularFileSuffixRemover('class');

      const result = remover['extractClassName']('dummy-path.ts');

      expect(result).to.be.null;
    });

    it.skip('should handle service files', () => {
      remover = new AngularFileSuffixRemover('service');
      const content = 'export class MyService { }';

      const originalReadFileSync = fs.readFileSync;
      const mockReadFileSync = sandbox.stub().returns(content);
      Object.defineProperty(fs, 'readFileSync', {
        value: mockReadFileSync,
        writable: true,
        configurable: true,
      });

      const result = remover['extractClassName']('dummy-path.ts');

      expect(result).to.not.be.null;
      expect(result!.className).to.equal('MyService');
      expect(result!.newClassName).to.equal('My');
      expect(result!.isClass).to.be.true;
    });

    it.skip('should handle guard files with function syntax', () => {
      remover = new AngularFileSuffixRemover('guard');
      const content = 'export const MyGuard = () => true;';

      const originalReadFileSync = fs.readFileSync;
      const mockReadFileSync = sandbox.stub().returns(content);
      Object.defineProperty(fs, 'readFileSync', {
        value: mockReadFileSync,
        writable: true,
        configurable: true,
      });

      const result = remover['extractClassName']('dummy-path.ts');

      expect(result).to.not.be.null;
      expect(result!.className).to.equal('MyGuard');
      expect(result!.newClassName).to.equal('MyGuard');
      expect(result!.isClass).to.be.false;
    });

    it.skip('should handle export default function syntax', () => {
      remover = new AngularFileSuffixRemover('guard');
      const content = 'export default const MyGuard = () => true;';

      const originalReadFileSync = fs.readFileSync;
      const mockReadFileSync = sandbox.stub().returns(content);
      Object.defineProperty(fs, 'readFileSync', {
        value: mockReadFileSync,
        writable: true,
        configurable: true,
      });

      const result = remover['extractClassName']('dummy-path.ts');

      expect(result).to.not.be.null;
      expect(result!.className).to.equal('MyGuard');
      expect(result!.newClassName).to.equal('MyGuard');
      expect(result!.isClass).to.be.false;
    });

    it.skip('should return null when no matching class or function found', () => {
      const content = 'const someVariable = "test";';

      const originalReadFileSync = fs.readFileSync;
      const mockReadFileSync = sandbox.stub().returns(content);
      Object.defineProperty(fs, 'readFileSync', {
        value: mockReadFileSync,
        writable: true,
        configurable: true,
      });

      const result = remover['extractClassName']('dummy-path.ts');

      expect(result).to.be.null;
    });

    it.skip('should handle file read errors gracefully', () => {
      const originalReadFileSync = fs.readFileSync;
      const mockReadFileSync = sandbox
        .stub()
        .throws(new Error('File not found'));
      Object.defineProperty(fs, 'readFileSync', {
        value: mockReadFileSync,
        writable: true,
        configurable: true,
      });

      const result = remover['extractClassName']('dummy-path.ts');

      expect(result).to.be.null;

      // Restore original function
      Object.defineProperty(fs, 'readFileSync', {
        value: originalReadFileSync,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('capitalize', () => {
    beforeEach(() => {
      remover = new AngularFileSuffixRemover('component');
    });

    it('should capitalize first letter', () => {
      expect(remover['capitalize']('component')).to.equal('Component');
      expect(remover['capitalize']('service')).to.equal('Service');
      expect(remover['capitalize']('guard')).to.equal('Guard');
    });

    it('should handle empty strings', () => {
      expect(remover['capitalize']('')).to.equal('');
    });

    it('should handle single character strings', () => {
      expect(remover['capitalize']('a')).to.equal('A');
    });
  });

  describe('shouldSkipDirectory', () => {
    beforeEach(() => {
      remover = new AngularFileSuffixRemover('component');
    });

    it('should skip common directories', () => {
      expect(remover['shouldSkipDirectory']('node_modules')).to.be.true;
      expect(remover['shouldSkipDirectory']('dist')).to.be.true;
      expect(remover['shouldSkipDirectory']('.git')).to.be.true;
      expect(remover['shouldSkipDirectory']('coverage')).to.be.true;
      expect(remover['shouldSkipDirectory']('.angular')).to.be.true;
    });

    it('should not skip regular directories', () => {
      expect(remover['shouldSkipDirectory']('src')).to.be.false;
      expect(remover['shouldSkipDirectory']('components')).to.be.false;
      expect(remover['shouldSkipDirectory']('shared')).to.be.false;
    });
  });
});
