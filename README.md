<h1>
  <sub><img src="https://cdn.jsdelivr.net/gh/tomwhite007/rename-angular-component@main/assets/rename-angular-component-icon.png" height="40"></sub>
  Rename Angular Component
</h1>

Rename Angular components, directives, and services - including their filenames, class names and selectors all in one go

Currently works with these Angular features:

- components
- directives
- services
- guards
- modules

## How to use

Right-click the Angular file or its associated sibling file (.html, .scss, .spec.ts).

Click 'Rename Angular Component' and then enter a new name.

The extension converts the text you enter into kebab case for the filename, capital case for the class name, the correct case for the type of selector, and then adds all the existing pre and postfixes back on.

![Rename Angular Component in action](https://cdn.jsdelivr.net/gh/tomwhite007/rename-angular-component@main/assets/rename-angular-component-demo.gif)

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

This extension contributes the following settings:

- `renameAngularComponent.debugLog`: Enable/disable debug logging to file for optional submission with new issue posts
- `renameAngularComponent.useLocalDirectPaths`: Update imports/exports with direct local paths even if wildcard path exists

## Known Issues

1. [Add flow for unexpected Selector name](https://github.com/tomwhite007/rename-angular-component/issues/13)
1. [Naming Convention Problem (cannot reproduce)](https://github.com/tomwhite007/rename-angular-component/issues/29)
1. [Extension does not support WSL](https://github.com/tomwhite007/rename-angular-component/issues/28)

## Support

This extension is under active development.

If you have a problem using the extension or you find a bug, please [raise an issue](https://github.com/tomwhite007/rename-angular-component/issues), and we'll get back to you asap.

## Thanks

Thanks to [Max Mumford](https://github.com/maxmumford) for help finding bugs after initial release.

Thanks to [Aristeidis Bampakos](https://github.com/bampakoa) for feature guidance.

Thanks to you for reading this.

## Release Notes

Latest version: [2.1.3] - 2022-07-29

- Fix: Case insensitive drive letter for Windows (for non default)
