export type AngularConstruct = 'component' | 'directive' | 'service' | 'module';
export interface OriginalFileDetails {
  path: string;
  file: string;
  stub: string;
}
export interface OriginalComponentClassFileDetails {
  filePath: string;
  className: string;
  selector: string;
}
