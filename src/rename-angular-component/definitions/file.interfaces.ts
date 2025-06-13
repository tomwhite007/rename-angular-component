export type AngularConstruct =
  | 'component'
  | 'directive'
  | 'service'
  | 'module'
  | 'guard'
  | 'pipe';

export type DefinitionType = 'class' | 'function' | null; // TODO: support more definitions later

export interface OriginalFileDetails {
  path: string;
  file: string;
  fileWithoutType: string;
  stub: string;
  filePath: string;
}

export type AngularConstructOrUnknownFile = AngularConstruct | 'file';

export interface CoreFileDefinitionDetails {
  definitionName: string;
  definitionType: DefinitionType;
  decoratorName: string;
}
