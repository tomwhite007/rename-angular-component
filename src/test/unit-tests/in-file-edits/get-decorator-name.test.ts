const expect = require('chai').expect;
import { describe, it } from 'mocha';
import { getDecoratorName } from '../../../rename-angular-component/in-file-edits/get-decorator-name.function';

describe('getDecoratorName', () => {
  it('should return NgModule for module construct', () => {
    expect(getDecoratorName('module')).to.equal('NgModule');
  });

  it('should return Component for component construct', () => {
    expect(getDecoratorName('component')).to.equal('Component');
  });

  it('should return Directive for directive construct', () => {
    expect(getDecoratorName('directive')).to.equal('Directive');
  });

  it('should return Injectable for service construct', () => {
    expect(getDecoratorName('service')).to.equal('Injectable');
  });

  it('should return Injectable for guard construct', () => {
    expect(getDecoratorName('guard')).to.equal('Injectable');
  });
});
