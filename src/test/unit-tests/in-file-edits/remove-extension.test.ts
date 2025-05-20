const expect = require('chai').expect;

import { describe, it } from 'mocha';
import { removeExtension } from '../../../rename-angular-component/in-file-edits/remove-extension';

describe('removeExtension', () => {
  it('should remove .ts extension', () => {
    expect(removeExtension('test.component.ts')).to.equal('test.component');
  });

  it('should remove .html extension', () => {
    expect(removeExtension('test.component.html')).to.equal('test.component');
  });

  it('should remove .scss extension', () => {
    expect(removeExtension('test.component.scss')).to.equal('test.component');
  });

  it('should remove .css extension', () => {
    expect(removeExtension('test.component.css')).to.equal('test.component');
  });
});
