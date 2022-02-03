export type AngularConstruct =
  | 'component'
  | 'directive'
  | 'service'
  | 'module'
  | 'guard';

export interface OriginalFileDetails {
  path: string;
  file: string;
  stub: string;
  filePath: string;
}
