export interface Reference {
  path: string;
  specifiers: string[];
  isExport?: boolean;
}

export interface FoundItem {
  itemType:
    | 'importPath'
    | 'exportPath'
    | 'class'
    | 'selector'
    | 'templateUrl'
    | 'styleUrl'
    | 'styleUrls'
    | 'attributeInput';
  itemText: string;
  specifiers?: string[];
  location: { start: number; end: number };
}
