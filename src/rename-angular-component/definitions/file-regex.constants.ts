export const componentRegexPartial = `(?=\\.component\\.(spec\\.ts|scss|css|sass|less|html|ts)$)`;
export const directiveRegexPartial = `(?=\\.directive\\.(spec.ts|ts)$)`;
export const serviceRegexPartial = `(?=\\.service\\.(spec.ts|ts)$)`;
export const guardRegexPartial = `(?=\\.guard\\.(spec.ts|ts)$)`;
export const anyConstructRegexPartial = `(?=.+\\.(spec\.ts|scss|css|sass|less|html|ts)$)`;
export const likeFilesRegexPartialLookup: { [key: string]: string } = {
  component: componentRegexPartial,
  directive: directiveRegexPartial,
  service: serviceRegexPartial,
  guard: guardRegexPartial,
  any: anyConstructRegexPartial,
};
