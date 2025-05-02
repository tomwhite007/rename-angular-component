const expect = require('chai').expect;
import { describe, it } from 'mocha';
import { getCoreFilePath } from '../../../rename-angular-component/in-file-edits/get-core-file-path.function';

describe('getCoreFilePath', () => {
  it('should return the path of the first core construct file', () => {
    const filesToMove = [
      {
        filePath: '/path/to/test.component.html',
        isCoreConstruct: false,
        newFilePath: '/new-path/to/new-test.component.html',
      },
      {
        filePath: '/path/to/test.component.ts',
        isCoreConstruct: true,
        newFilePath: '/new-path/to/new-test.component.ts',
      },
      {
        filePath: '/path/to/test.component.scss',
        isCoreConstruct: false,
        newFilePath: '/new-path/to/new-test.component.scss',
      },
    ];

    const result = getCoreFilePath(filesToMove);
    expect(result).to.equal('/path/to/test.component.ts');
  });

  it('should return undefined when no core construct files exist', () => {
    const filesToMove = [
      {
        filePath: '/path/to/test.component.html',
        isCoreConstruct: false,
        newFilePath: '/new-path/to/new-test.component.html',
      },
      {
        filePath: '/path/to/test.component.scss',
        isCoreConstruct: false,
        newFilePath: '/new-path/to/new-test.component.scss',
      },
    ];

    const result = getCoreFilePath(filesToMove);
    expect(result).to.be.undefined;
  });

  it('should return undefined when filesToMove is empty', () => {
    const result = getCoreFilePath([]);
    expect(result).to.be.undefined;
  });
});
