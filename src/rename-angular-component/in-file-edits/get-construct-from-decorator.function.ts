import {
  AngularConstructOrPlainFile,
  DefinitionType,
} from '../definitions/file.interfaces';

export function getConstructFromDecorator(
  decoratorName: string | null,
  definitionType: DefinitionType
): AngularConstructOrPlainFile | null {
  switch (decoratorName) {
    case 'Component':
      return 'component';
    case 'Directive':
      return 'directive';
    case 'Injectable':
      return 'service';
    case 'Pipe':
      return 'pipe';
    case 'NgModule':
      return 'module';
    case 'Guard':
      return 'guard';
    default:
      if (definitionType) {
        return 'file';
      }
      return null;
  }
}
