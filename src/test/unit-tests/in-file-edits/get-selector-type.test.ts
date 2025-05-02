const expect = require('chai').expect;

import { describe, it } from 'mocha';
import { getSelectorType } from '../../../rename-angular-component/in-file-edits/get-selector-type.function';

describe('getSelectorType', () => {
  it('should identify element selector', () => {
    expect(getSelectorType('app-test')).to.equal('element');
    expect(getSelectorType('test-component')).to.equal('element');
  });

  it('should identify attribute selector', () => {
    expect(getSelectorType('[appTest]')).to.equal('attribute');
    expect(getSelectorType('[test-component]')).to.equal('attribute');
  });

  it('should identify class selector', () => {
    expect(getSelectorType('.app-test')).to.equal('class');
    expect(getSelectorType('.test-component')).to.equal('class');
  });

  it('should return null for invalid selectors', () => {
    expect(getSelectorType('')).to.be.null;
    expect(getSelectorType('123')).to.be.null;
    expect(getSelectorType('@test')).to.be.null;
  });

  it('should handle empty string', () => {
    expect(getSelectorType('')).to.be.null;
  });
});
