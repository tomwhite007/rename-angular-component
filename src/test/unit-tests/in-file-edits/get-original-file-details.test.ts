const expect = require('chai').expect;

import { describe, it } from 'mocha';
import { getOriginalFileDetails } from '../../../rename-angular-component/in-file-edits/get-original-file-details.function';

describe('getOriginalFileDetails', () => {
  it('should extract details from component file path', () => {
    const result = getOriginalFileDetails('/path/to/test.component.ts');

    expect(result).to.deep.equal({
      path: '/path/to',
      file: 'test.component.ts',
      stub: 'test',
      filePath: '/path/to/test.component.ts',
    });
  });

  it('should extract details from service file path', () => {
    const result = getOriginalFileDetails('/path/to/test.service.ts');

    expect(result).to.deep.equal({
      path: '/path/to',
      file: 'test.service.ts',
      stub: 'test',
      filePath: '/path/to/test.service.ts',
    });
  });

  it('should extract details from directive file path', () => {
    const result = getOriginalFileDetails('/path/to/test.directive.ts');

    expect(result).to.deep.equal({
      path: '/path/to',
      file: 'test.directive.ts',
      stub: 'test',
      filePath: '/path/to/test.directive.ts',
    });
  });

  it('should extract details from spec file path', () => {
    const result = getOriginalFileDetails('/path/to/test.component.spec.ts');

    expect(result).to.deep.equal({
      path: '/path/to',
      file: 'test.component.spec.ts',
      stub: 'test',
      filePath: '/path/to/test.component.spec.ts',
    });
  });

  it('should extract details from style file path', () => {
    const result = getOriginalFileDetails('/path/to/test.component.scss');

    expect(result).to.deep.equal({
      path: '/path/to',
      file: 'test.component.scss',
      stub: 'test',
      filePath: '/path/to/test.component.scss',
    });
  });

  it('should handle Windows paths', () => {
    const result = getOriginalFileDetails('C:\\path\\to\\test.component.ts');

    expect(result).to.deep.equal({
      path: 'c:/path/to',
      file: 'test.component.ts',
      stub: 'test',
      filePath: 'c:/path/to/test.component.ts',
    });
  });
});
