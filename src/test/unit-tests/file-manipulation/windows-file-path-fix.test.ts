const expect = require('chai').expect;
import { describe, it } from 'mocha';
import { windowsFilePathFix } from '../../../rename-angular-component/file-manipulation/windows-file-path-fix.function';

describe('windowsFilePathFix', () => {
  it('should convert Windows drive letter to lowercase', () => {
    const result = windowsFilePathFix('/C:/path/to/file');
    expect(result).to.equal('c:/path/to/file');
  });

  it('should handle Windows drive letter without leading slash', () => {
    const result = windowsFilePathFix('C:/path/to/file');
    expect(result).to.equal('c:/path/to/file');
  });

  it('should convert backslashes to forward slashes by default', () => {
    const result = windowsFilePathFix('c:\\path\\to\\file');
    expect(result).to.equal('c:/path/to/file');
  });

  it('should convert forward slashes to backslashes when backSlash is true', () => {
    const result = windowsFilePathFix('c:/path/to/file', true);
    expect(result).to.equal('c:\\path\\to\\file');
  });

  it('should handle paths without Windows drive letter', () => {
    const result = windowsFilePathFix('/path/to/file');
    expect(result).to.equal('/path/to/file');
  });

  it('should handle mixed slashes', () => {
    const result = windowsFilePathFix('c:/path\\to/file');
    expect(result).to.equal('c:/path/to/file');
  });

  it('should handle mixed slashes with backSlash true', () => {
    const result = windowsFilePathFix('c:/path\\to/file', true);
    expect(result).to.equal('c:\\path\\to\\file');
  });
});
