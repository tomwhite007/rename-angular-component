export type AngularConstruct =
  | 'component'
  | 'directive'
  | 'service'
  | 'module'
  | 'guard'
  | 'pipe';

export type DefinitionType =
  | 'class'
  | 'function'
  | 'variable'
  | 'interface'
  | 'enum'
  | null;

export interface OriginalFileDetails {
  path: string;
  file: string;
  fileWithoutType: string;
  stub: string;
  filePath: string;
}

export type AngularConstructOrPlainFile = AngularConstruct | 'file';

export interface CoreFileDefinitionDetails {
  definitionName: string;
  definitionType: DefinitionType;
  decoratorName: string;
}
