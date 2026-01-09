const expect = require('chai').expect;

import { describe, it } from 'mocha';
import { renameSelectorInTemplate } from '../../../rename-angular-component/in-file-edits/rename-selector-in-template.function';

describe('renameSelectorInTemplate', () => {
  it('should replace element selector in template', () => {
    const html = '<app-old></app-old>';
    const result = renameSelectorInTemplate(
      html,
      'app-old',
      'app-new',
      'component'
    );
    expect(result).to.equal('<app-new></app-new>');
  });

  it('should replace attribute selector in template', () => {
    const html = '<div app-old></div>';
    const result = renameSelectorInTemplate(
      html,
      'app-old',
      'app-new',
      'directive'
    );
    expect(result).to.equal('<div app-new></div>');
  });

  it('should replace multiple occurrences of selector', () => {
    const html = '<app-old><div app-old></div></app-old>';
    const result = renameSelectorInTemplate(
      html,
      'app-old',
      'app-new',
      'directive'
    );
    expect(result).to.equal('<app-new><div app-new></div></app-new>');
  });

  it('should return null when selector not found', () => {
    const html = '<app-older></app-older>';
    const result = renameSelectorInTemplate(
      html,
      'app-old',
      'app-new',
      'component'
    );
    expect(result).to.be.null;
  });

  it('should return null when selector not found', () => {
    const html = '<app-other></app-other>';
    const result = renameSelectorInTemplate(
      html,
      'app-old',
      'app-new',
      'component'
    );
    expect(result).to.be.null;
  });

  it('should handle complex templates', () => {
    const html = `
      <app-old>
        <div class="content" app-old>
          <span app-old>Content</span>
        </div>
      </app-old>
    `;
    const result = renameSelectorInTemplate(
      html,
      'app-old',
      'app-new',
      'component'
    );
    expect(result).to.equal(`
      <app-new>
        <div class="content" app-new>
          <span app-new>Content</span>
        </div>
      </app-new>
    `);
  });

  it('should handle self-closing tags', () => {
    const html = '<app-old />';
    const result = renameSelectorInTemplate(
      html,
      'app-old',
      'app-new',
      'component'
    );
    expect(result).to.equal('<app-new />');
  });

  it('should rename pipe names in template', () => {
    const html = '<div>{{ value | oldPipe }}</div>';
    const result = renameSelectorInTemplate(html, 'oldPipe', 'newPipe', 'pipe');
    expect(result).to.equal('<div>{{ value | newPipe }}</div>');
  });

  it('should replace attribute selector with brackets in template', () => {
    const html = '<div appOld></div>';
    const result = renameSelectorInTemplate(
      html,
      '[appOld]',
      '[appNew]',
      'directive'
    );
    expect(result).to.equal('<div appNew></div>');
  });

  it('should replace class selector with dot in template', () => {
    const html = '<div class="app-old"></div>';
    const result = renameSelectorInTemplate(
      html,
      '.app-old',
      '.app-new',
      'component'
    );
    expect(result).to.equal('<div class="app-new"></div>');
  });
});
