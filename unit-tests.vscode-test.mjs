import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'out/test/unit-tests/**/*.test.js',
  label: 'unitTests',
});
