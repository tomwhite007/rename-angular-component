const expect = require('chai').expect;

import { describe, it } from 'mocha';
import { stripSelectorBraces } from '../../../rename-angular-component/in-file-edits/strip-selector-braces.function';

describe('stripSelectorBraces', () => {
  it('should remove square brackets from attribute selector', () => {
    const result = stripSelectorBraces('[app-test]');
    expect(result).to.equal('app-test');
  });

  it('should remove dots from class selector', () => {
    const result = stripSelectorBraces('.app-test');
    expect(result).to.equal('app-test');
  });

  it('should remove both brackets and dots', () => {
    const result = stripSelectorBraces('[.app-test]');
    expect(result).to.equal('app-test');
  });

  it('should remove quotes when andQuotes is true', () => {
    const result = stripSelectorBraces("'[app-test]'", true);
    expect(result).to.equal('app-test');
  });

  it('should not remove quotes when andQuotes is false', () => {
    const result = stripSelectorBraces("'[app-test]'");
    expect(result).to.equal("'app-test'");
  });

  it('should handle multiple quotes', () => {
    const result = stripSelectorBraces("'''[app-test]'''", true);
    expect(result).to.equal('app-test');
  });
});
