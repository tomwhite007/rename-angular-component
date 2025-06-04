export type AngularConstruct =
  | 'component'
  | 'directive'
  | 'service'
  | 'module'
  | 'guard'
  | 'pipe';

export interface OriginalFileDetails {
  path: string;
  file: string;
  fileWithoutType: string;
  stub: string;
  filePath: string;
}

export type AngularConstructOrUnknownFile = AngularConstruct | 'file';
