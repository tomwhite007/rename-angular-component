const componentRegexPartial = `(?=\\.(spec\\.ts|scss|css|sass|less|html|ts)$)`;
const generalRegexPartial = `(?=\\.(spec.ts|ts)$)`;

const anyConstructRegexPartial = `(?=\\.[\\w\\-_]+\\.(spec\\.ts|scss|css|sass|less|html|ts)$)`;
export const likeFilesRegexPartialLookup: { [key: string]: string } = {
  component: componentRegexPartial,
  directive: generalRegexPartial,
  service: generalRegexPartial,
  guard: generalRegexPartial,
  module: generalRegexPartial,
  pipe: generalRegexPartial,
  any: anyConstructRegexPartial,
};

export const compatibleFileTypes = /\.(spec\.ts|scss|css|sass|less|html|ts)$/;
export const tsFileButNotSpec = /^(?!.*\.spec\.ts$)(?=.*\.ts$)/;
