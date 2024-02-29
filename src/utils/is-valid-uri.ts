export class IsValid {
  static componentUri(uri: string): boolean {
    return /^.+\.component\.(spec.ts|scss|css|sass|less|html|ts)$/.test(uri);
  }

  static serviceUri(uri: string): boolean {
    return /^.+\.service\.(spec.ts|ts)$/.test(uri);
  }

  static directiveUri(uri: string): boolean {
    return /^.+\.directive\.(spec.ts|ts)$/.test(uri);
  }

  static guardUri(uri: string): boolean {
    return /^.+\.guard\.(spec.ts|ts)$/.test(uri);
  }

  static moduleUri(uri: string): boolean {
    return /^.+\.module\.(spec.ts|ts)$/.test(uri);
  }
}
