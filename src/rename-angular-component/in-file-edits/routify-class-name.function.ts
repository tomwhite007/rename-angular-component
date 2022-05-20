export function routifyClassName(className: string, filePath: string) {
  return filePath.endsWith('-routing.module.ts') &&
    !className.endsWith('RoutingModule')
    ? className.replace('Module', 'RoutingModule')
    : className;
}
