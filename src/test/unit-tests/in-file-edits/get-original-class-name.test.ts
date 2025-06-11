const expect = require('chai').expect;
const sinon = require('sinon');

import fs from 'fs-extra-promise';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { getOriginalDefinitionName } from '../../../rename-angular-component/in-file-edits/get-original-definition-name.function';

describe('getOriginalClassName', () => {
  let readFileStub: sinon.SinonStub;

  beforeEach(() => {
    readFileStub = sinon.stub(fs, 'readFileAsync');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return the expected class name when found', async () => {
    const sourceText = `
      @Component({
        selector: 'app-test'
      })
      export class TestComponent {}
    `;

    readFileStub.resolves(sourceText);

    const className = await getOriginalDefinitionName(
      'test',
      'test.component.ts',
      'component'
    );
    expect(className).to.equal('TestComponent');
  });

  it('should return the expected class name when multiple decorators exist', async () => {
    const sourceText = `
      @Injectable()
      export class TestService {}

      @Component({
        selector: 'app-test'
      })
      export class TestComponent {}
    `;

    readFileStub.resolves(sourceText);

    const className = await getOriginalDefinitionName(
      'test',
      'test.component.ts',
      'component'
    );
    expect(className).to.equal('TestComponent');
  });

  it('should throw error when no class with matching decorator is found', async () => {
    const sourceText = `
      @Injectable()
      export class TestService {}
    `;

    readFileStub.resolves(sourceText);

    try {
      await getOriginalDefinitionName('test', 'test.component.ts', 'component');
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).to.equal(
        'Class Name and Component decorator not found in component file. Stopping.'
      );
    }
  });

  it('should throw error when multiple classes with matching decorator are found', async () => {
    const sourceText = `
      @Component({
        selector: 'app-test1'
      })
      export class Test1Component {}

      @Component({
        selector: 'app-test2'
      })
      export class Test2Component {}
    `;

    readFileStub.resolves(sourceText);

    try {
      await getOriginalDefinitionName('test', 'test.component.ts', 'component');
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).to.equal(
        'Class Name not confirmed because there is more than one Component decorator found in component file. Stopping.'
      );
    }
  });
});
