export interface Reference {
  path: string;
  specifiers: string[];
  isExport?: boolean;
}

export type FoundItemType =
  | 'importPath'
  | 'exportPath'
  | 'class'
  | 'selector'
  | 'name' // for pipes
  | 'templateUrl'
  | 'styleUrl'
  | 'styleUrls'
  | 'attributeInput';

export interface FoundItem {
  itemType: FoundItemType;
  itemText: string;
  specifiers?: string[];
  location: { start: number; end: number };
}
