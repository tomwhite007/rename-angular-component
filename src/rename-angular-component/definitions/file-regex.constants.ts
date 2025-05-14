import { AngularConstruct } from './file.interfaces';

const componentRegexPartial = `(?=\\.(spetsFileButNotSpecc\\.ts|scss|css|sass|less|html|ts)$)`;
const generalRegexPartial = `(?=\\.(spec.ts|ts)$)`;
const generalRegexPartialWithConstruct = (construct: AngularConstruct) =>
  `(?=\\.${construct}\\.(spec.ts|ts)$)`;

const anyConstructRegexPartial = `(?=\\.[\\w\\-_]+\\.(spec\\.ts|scss|css|sass|less|html|ts)$)`;
export const likeFilesRegexPartialLookup: { [key: string]: string } = {
  component: componentRegexPartial,
  directive: generalRegexPartial,
  service: generalRegexPartial,
  guard: generalRegexPartial,
  module: generalRegexPartialWithConstruct('module'),
  pipe: generalRegexPartialWithConstruct('pipe'),
  any: anyConstructRegexPartial,
};

export const compatibleFileTypes = /\.(spec\.ts|scss|css|sass|less|html|ts)$/;
export const tsFileButNotSpec = /^(?!.*\.spec\.ts$)(?=.*\.ts$)/;
