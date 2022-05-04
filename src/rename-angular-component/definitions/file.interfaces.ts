export type AngularConstruct =
  | 'component'
  | 'directive'
  | 'service'
  | 'module'
  | 'guard'
  | 'class'
  | 'enum'
  | 'guard'
  | 'interceptor'
  | 'interface'
  | 'module'
  | 'pipe'
  | 'resolver';

export interface OriginalFileDetails {
  path: string;
  file: string;
  stub: string;
  filePath: string;
}
