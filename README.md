<h1>
  <sub><img src="https://cdn.jsdelivr.net/gh/tomwhite007/simple-reactive-viewmodel-example@master/src/assets/rename-angular-component-icon.png" height="40"></sub>
  Rename Angular Component
</h1>

Rename Angular components, directives and services - including their filenames, class names and selectors all in one go

## How to use

Right-click the Angular file or its associated sibling file (.html, .scss, .spec.ts).

Click 'Rename Angular Component' and then enter a new name.

The extension converts the text you enter into kebab case for the filename, capital case for the class name and the correct case for the type of selector, and adds all the existing pre and postfixes back on.

![Rename Angular Component in action](https://cdn.jsdelivr.net/gh/tomwhite007/simple-reactive-viewmodel-example@master/src/assets/rename-angular-component-demo.gif)

## Features

Based on the same naming convention in the [Angular Style Guide](https://angular.io/guide/styleguide#style-02-01) and following the file pattern created by the Angular CLI, this extension will:

- Rename the files files associated with the component, directive or service whilst retaining their original postfixes
- Rename the containing folder if it has the same name as the original file selected
- Rename the class name of the component, directive or service to match the new file name - provided the class name matches the same naming convention as the filename
- Rename the element, attribute or class selectors inside the class decorator meta data, and in all html templates in the repo (provided the selector follows the same naming convention)
- Fix all import paths and their class names

_Example - Changes to Component file after rename:_

![Changes to Component file after rename](https://cdn.jsdelivr.net/gh/tomwhite007/simple-reactive-viewmodel-example@master/src/assets/diff-component-decorator-meta-changes.png)

_Example - Changes to an element selector in a parent template:_

![Changes to Component file after rename](https://cdn.jsdelivr.net/gh/tomwhite007/simple-reactive-viewmodel-example@master/src/assets/diff-template-selector-changed.png)

## Extension Settings

Currently, there are no config options for this first release. But there are plenty coming soon.

## Known Issues

1. Doesn't support (but will do soon) changing element, attribute or class selectors inside:
   - component _inline_ templates
   - test spec files
   - Storybook files
2. Currently, doesn't rename other files in the same folder with the same stub / prefix, unless they are directly associated: e.g. \*.component.ts, \*.component.scss, \*.component.html, and \*.component.spec.ts (are directly associated). But this option will be added as a config item soon.
3. If you have two components or directives in your repo that have the same selector, this process will currently rename those instances in the html templates as well. This will be addressed in a future version.
4. It won't fix a broken naming convention. If your sibling files don't match the Angular Style guide filename convention, or your class name or selector don't match the original filename, they won't be changed. This will be addressed in a future version as an option.
5. Currently doesn't support renaming import paths in [Lazy Loaded Routes](https://angular.io/guide/lazy-loading-ngmodules). This will be added in the next version.

## Release Notes

### 0.1.0

Initial release of extension

---
