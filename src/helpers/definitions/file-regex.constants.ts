export const componentRegexPartial = `\\.component\\.(spec.ts|scss|html|ts)$`;
export const directiveRegexPartial = `\\.directive\\.(spec.ts|ts)$`;
export const serviceRegexPartial = `\\.service\\.(spec.ts|ts)$`;
export const likeFilesRegexPartialLookup: { [key: string]: string } = {
  component: componentRegexPartial,
  directive: directiveRegexPartial,
  service: serviceRegexPartial,
};
