const expect = require('chai').expect;
import { describe, it } from 'mocha';
import { generateNewSelector } from '../../../rename-angular-component/in-file-edits/generate-new-selector.function';

describe('generateNewSelector', () => {
  it('should generate new element selector', () => {
    const result = generateNewSelector('app-old', 'Old', 'New');
    expect(result).to.equal('app-new');
  });

  it('should generate new attribute selector', () => {
    const result = generateNewSelector('[appOld]', 'Old', 'New');
    expect(result).to.equal('[appNew]');
  });

  it('should generate new class selector', () => {
    const result = generateNewSelector('.app-old', 'old', 'new');
    expect(result).to.equal('.app-new');
  });

  it('should handle complex element selectors', () => {
    const result = generateNewSelector(
      'app-old-component',
      'old-component',
      'new-component'
    );
    expect(result).to.equal('app-new-component');
  });

  it('should handle complex attribute selectors', () => {
    const result = generateNewSelector(
      '[appOldComponent]',
      'OldComponent',
      'NewComponent'
    );
    expect(result).to.equal('[appNewComponent]');
  });

  it('should handle complex class selectors', () => {
    const result = generateNewSelector(
      '.app-old-component',
      'old-component',
      'new-component'
    );
    expect(result).to.equal('.app-new-component');
  });

  it('should return empty string for empty selector', () => {
    const result = generateNewSelector('', 'old', 'new');
    expect(result).to.equal('');
  });

  it('should handle multiple occurrences of stub in selector', () => {
    const result = generateNewSelector('app-old-old', 'old-old', 'new-new');
    expect(result).to.equal('app-new-new');
  });
});
