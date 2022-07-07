import { AngularConstruct } from './file.interfaces';

const componentRegexPartial = `(?=\\.component\\.(spec\\.ts|scss|css|sass|less|html|ts)$)`;
const generalRegexPartial = (construct: AngularConstruct) =>
  `(?=\\.${construct}\\.(spec.ts|ts)$)`;
const moduleRegexPartial = `(?=\\.module\\.(spec.ts|ts)$)`;

const anyConstructRegexPartial = `(?=\\.[\\w\\-_]+\\.(spec\\.ts|scss|css|sass|less|html|ts)$)`;
export const likeFilesRegexPartialLookup: { [key: string]: string } = {
  component: componentRegexPartial,
  directive: generalRegexPartial('directive'),
  service: generalRegexPartial('service'),
  guard: generalRegexPartial('guard'),
  module: moduleRegexPartial,
  any: anyConstructRegexPartial,
};
