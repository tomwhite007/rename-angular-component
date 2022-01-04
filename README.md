<h1>
  <sub><img src="https://cdn.jsdelivr.net/gh/tomwhite007/simple-reactive-viewmodel-example@master/src/assets/rename-angular-component-icon.png" height="40"></sub>
  Rename Angular Component
</h1>

Rename Angular components, directives and services - including their filenames, class names and selectors all in one go

## How to use

Right-click the Angular file or its associated sibling file (.html, .scss, .spec.ts).

Click 'Rename Angular Component' and then enter a new name.

The extension converts the text you enter into kebab case for the filename, capital case for the class name, the correct case for the type of selector, and then adds all the existing pre and postfixes back on.

![Rename Angular Component in action](https://cdn.jsdelivr.net/gh/tomwhite007/simple-reactive-viewmodel-example@master/src/assets/rename-angular-component-demo.gif)

## Features

Based on the same naming convention in the [Angular Style Guide](https://angular.io/guide/styleguide#style-02-01) and following the file pattern created by the Angular CLI, this extension will:

- Rename the files files associated with the component, directive or service whilst retaining their original postfixes
- Rename the containing folder if it has the same name as the original file selected
- Rename the class name of the component, directive or service to match the new file name (provided the class name follows the same naming convention)
- Rename the element, attribute or class selectors inside the class decorator meta data, and in all html templates in the repo (provided the selector follows the correct naming convention)
- Fix all import paths and their class names

_Example - Changes to Component file after rename:_

![Changes to Component file after rename](https://cdn.jsdelivr.net/gh/tomwhite007/simple-reactive-viewmodel-example@master/src/assets/diff-component-decorator-meta-changes.png)

_Example - Changes to an element selector in a parent template:_

![Changes to Component file after rename](https://cdn.jsdelivr.net/gh/tomwhite007/simple-reactive-viewmodel-example@master/src/assets/diff-template-selector-changed.png)

## Extension Settings

Currently, there are no config options for this first release. But there are plenty coming soon.

## Known Issues

1. [Doesn't support (but will do soon) selector changes inside Inline Templates](https://github.com/tomwhite007/rename-angular-component/issues/5) in:
   - Component class files
   - Test spec files
   - Storybook files
2. [Doesn't rename other files in the same folder with the same stub / prefix unless they are a sibling](https://github.com/tomwhite007/rename-angular-component/issues/6). Currently, the 2-4 directly associated sibling files do get changed, e.g. \*.component.ts, \*.component.scss, \*.component.html, and \*.component.spec.ts (are directly associated). But this option will be added as a config item soon.
3. [If you have two components or directives in your repo that have the same selector, this process will currently rename those instances in the html templates as well](https://github.com/tomwhite007/rename-angular-component/issues/7). This will be addressed in a future version.
4. It won't fix a broken naming convention. [If your sibling files don't match the Angular Style guide filename convention, or your class name or selector don't match the original filename, they won't be changed](https://github.com/tomwhite007/rename-angular-component/issues/8). This will be addressed in a future version as an option.
5. [Currently doesn't support renaming import paths](https://github.com/tomwhite007/rename-angular-component/issues/9) in [Lazy Loaded Routes](https://angular.io/guide/lazy-loading-ngmodules). This will be added in the next version.

## Release Notes

### 1.0.0

Initial release of extension

### 1.0.1

Bug fix: Discover original Class Name rather than predict it

### 1.0.2

Feature: Add optional debug log to file for issue creation
