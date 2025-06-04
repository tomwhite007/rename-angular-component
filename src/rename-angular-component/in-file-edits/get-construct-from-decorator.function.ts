import { AngularConstruct } from '../definitions/file.interfaces';

export function getConstructFromDecorator(
  decoratorName: string
): AngularConstruct | undefined {
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
      return undefined;
  }
}
