const expect = require('chai').expect;
import { after, before, describe, it } from 'mocha';
import sinon from 'sinon';
import { workspace, WorkspaceConfiguration } from 'vscode';
import { conf } from '../../../move-ts-indexer/util/helper-functions';
import {
  getAngularCoreClassEdits,
  getClassNameEdits,
  SelectorTransfer,
} from '../../../rename-angular-component/in-file-edits/custom-edits';

describe('Custom Edits', () => {
  const stubGetConfiguration = (enabled: boolean) =>
    sinon.stub(workspace, 'getConfiguration').returns({
      get: (property: string) => {
        return enabled;
      },
    } as WorkspaceConfiguration);

  describe('getCoreClassEdits', () => {
    describe('with Angular 20+ folder naming convention', () => {
      before(() => {
        stubGetConfiguration(true);
      });

      after(() => {
        sinon.restore();
      });

      it('should handle class name changes and singular styleUrl', () => {
        const sourceText = `
        @Component({
          selector: 'app-old',
          templateUrl: './old.component.html',
          styleUrl: './old.component.scss'
        })
        export class OldComponent {
          @Input() old: string;
        }
      `;

        const selectorTransfer = new SelectorTransfer();
        const edits = getAngularCoreClassEdits(
          'OldComponent',
          'NewComponent',
          'old',
          'old.component',
          'new',
          'new.component',
          'component',
          selectorTransfer
        )('test.ts', sourceText);

        expect(edits).to.have.length(4);
        expect(edits[0].replacement).to.equal("'app-new.component'");
        expect(edits[1].replacement).to.equal("'./new.component.html'");
        expect(edits[2].replacement).to.equal("'./new.component.scss'");
        expect(edits[3].replacement).to.equal('NewComponent');
      });

      it('should handle attribute selectors', () => {
        const sourceText = `
        @Component({
          selector: '[app-old]',
          templateUrl: './old.component.html'
        })
        export class OldComponent {
          @Input() old: string;
        }
      `;

        const selectorTransfer = new SelectorTransfer();
        const edits = getAngularCoreClassEdits(
          'OldComponent',
          'NewComponent',
          'old',
          'old.component',
          'new',
          'new.component',
          'component',
          selectorTransfer
        )('test.ts', sourceText);

        expect(edits).to.have.length(3);
        expect(edits[0].replacement).to.equal("'[appNewComponent]'");
        expect(edits[1].replacement).to.equal("'./new.component.html'");
        expect(edits[2].replacement).to.equal('NewComponent');
      });

      it('should handle multiple styleUrls', () => {
        const sourceText = `
        @Component({
          selector: 'app-old',
          styleUrls: ['./old.component.scss', './old.component.css']
        })
        export class OldComponent {}
      `;

        const selectorTransfer = new SelectorTransfer();
        const edits = getAngularCoreClassEdits(
          'OldComponent',
          'NewComponent',
          'old',
          'old.component',
          'new',
          'new.component',
          'component',
          selectorTransfer
        )('test.ts', sourceText);

        expect(edits).to.have.length(4);

        expect(conf('followAngular20+FolderNamingConvention', true)).to.equal(
          true
        );
        expect(edits[0].replacement).to.equal("'app-new.component'");
        expect(edits[1].replacement).to.equal("'./new.component.scss'");
        expect(edits[2].replacement).to.equal("'./new.component.css'");
        expect(edits[3].replacement).to.equal('NewComponent');
      });
    });

    describe('without Angular 20+ folder naming convention', () => {
      before(() => {
        stubGetConfiguration(false);
      });

      after(() => {
        sinon.restore();
      });

      it('should handle class name changes and singular styleUrl', () => {
        const sourceText = `
        @Component({
          selector: 'app-old',
          templateUrl: './old.component.html',
          styleUrl: './old.component.scss'
        })
        export class OldComponent {
          @Input() old: string;
        }
      `;

        const selectorTransfer = new SelectorTransfer();
        const edits = getAngularCoreClassEdits(
          'OldComponent',
          'NewComponent',
          'old',
          'old.component',
          'new',
          'new.component',
          'component',
          selectorTransfer
        )('test.ts', sourceText);

        expect(edits).to.have.length(4);
        expect(edits[0].replacement).to.equal("'app-new'");
        expect(edits[1].replacement).to.equal("'./new.component.html'");
        expect(edits[2].replacement).to.equal("'./new.component.scss'");
        expect(edits[3].replacement).to.equal('NewComponent');
      });

      it('should handle attribute selectors', () => {
        const sourceText = `
        @Component({
          selector: '[app-old]',
          templateUrl: './old.component.html'
        })
        export class OldComponent {
          @Input() old: string;
        }
      `;

        const selectorTransfer = new SelectorTransfer();
        const edits = getAngularCoreClassEdits(
          'OldComponent',
          'NewComponent',
          'old',
          'old.component',
          'new',
          'new.component',
          'component',
          selectorTransfer
        )('test.ts', sourceText);

        expect(edits).to.have.length(3);
        expect(edits[0].replacement).to.equal("'[appNew]'");
        expect(edits[1].replacement).to.equal("'./new.component.html'");
        expect(edits[2].replacement).to.equal('NewComponent');
      });

      it('should handle multiple styleUrls', () => {
        const sourceText = `
        @Component({
          selector: 'app-old',
          styleUrls: ['./old.component.scss', './old.component.css']
        })
        export class OldComponent {}
      `;

        const selectorTransfer = new SelectorTransfer();
        const edits = getAngularCoreClassEdits(
          'OldComponent',
          'NewComponent',
          'old',
          'old.component',
          'new',
          'new.component',
          'component',
          selectorTransfer
        )('test.ts', sourceText);

        expect(edits).to.have.length(4);

        expect(conf('followAngular20+FolderNamingConvention', true)).to.equal(
          false
        );
        expect(edits[0].replacement).to.equal("'app-new'");
        expect(edits[1].replacement).to.equal("'./new.component.scss'");
        expect(edits[2].replacement).to.equal("'./new.component.css'");
        expect(edits[3].replacement).to.equal('NewComponent');
      });
    });
  });

  describe('getClassNameEdits', () => {
    it('should replace class name in imports', () => {
      const sourceText = `
        import { OldComponent } from './old.component';
        import { OldComponent as Alias } from './old.component';
      `;

      const edits = getClassNameEdits('OldComponent', 'NewComponent')(
        'test.ts',
        sourceText
      );

      expect(edits).to.have.length(2);
      expect(edits[0].replacement).to.equal('NewComponent');
      expect(edits[1].replacement).to.equal('NewComponent');
    });

    it('should replace class name in type references and instances', () => {
      const sourceText = `
        const component: OldComponent = new OldComponent();
        function test(param: OldComponent): OldComponent {
          return param;
        }
      `;

      const edits = getClassNameEdits('OldComponent', 'NewComponent')(
        'test.ts',
        sourceText
      );

      expect(edits).to.have.length(4);
      edits.forEach((edit: { replacement: string }) => {
        expect(edit.replacement).to.equal('NewComponent');
      });
    });

    it('should not replace partial matches', () => {
      const sourceText = `
        class NotOldComponent {}
        const oldComponent = new NotOldComponent();
      `;

      const edits = getClassNameEdits('OldComponent', 'NewComponent')(
        'test.ts',
        sourceText
      );

      expect(edits).to.have.length(0);
    });
  });

  describe('SelectorTransfer', () => {
    describe('with Angular 20+ folder naming convention', () => {
      before(() => {
        stubGetConfiguration(true);
      });

      after(() => {
        sinon.restore();
      });

      it('should store old and new selectors', () => {
        const sourceText = `
        @Component({
          selector: 'app-old'
        })
        export class OldComponent {}
      `;

        const selectorTransfer = new SelectorTransfer();
        getAngularCoreClassEdits(
          'OldComponent',
          'NewComponent',
          'old',
          'old.component',
          'new',
          'new',
          'component',
          selectorTransfer
        )('test.ts', sourceText);

        expect(selectorTransfer.oldSelector).to.equal('app-old');
        expect(selectorTransfer.newSelector).to.equal('app-new');
      });

      it('should store old and new selectors with .component suffix', () => {
        const sourceText = `
        @Component({
          selector: 'app-old'
        })
        export class OldComponent {}
      `;

        const selectorTransfer = new SelectorTransfer();
        getAngularCoreClassEdits(
          'OldComponent',
          'NewComponent',
          'old',
          'old.component',
          'new',
          'new.component',
          'component',
          selectorTransfer
        )('test.ts', sourceText);

        expect(selectorTransfer.oldSelector).to.equal('app-old');
        expect(selectorTransfer.newSelector).to.equal('app-new.component');
      });
    });

    describe('without Angular 20+ folder naming convention', () => {
      before(() => {
        stubGetConfiguration(false);
      });

      after(() => {
        sinon.restore();
      });

      it('should store old and new selectors', () => {
        const sourceText = `
        @Component({
          selector: 'app-old'
        })
        export class OldComponent {}
      `;

        const selectorTransfer = new SelectorTransfer();
        getAngularCoreClassEdits(
          'OldComponent',
          'NewComponent',
          'old',
          'old.component',
          'new',
          'new.component',
          'component',
          selectorTransfer
        )('test.ts', sourceText);

        expect(selectorTransfer.oldSelector).to.equal('app-old');
        expect(selectorTransfer.newSelector).to.equal('app-new');
      });
    });
  });
});
