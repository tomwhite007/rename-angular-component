<h1>
  <sub><img src="https://cdn.jsdelivr.net/gh/tomwhite007/rename-angular-component@main/assets/rename-angular-component-icon.png" height="40"></sub>
  Rename Angular Component
</h1>

Rename Angular components, directives, and services - including their filenames, class names and selectors all in one go

Works with these Angular features:

- components
- directives
- services
- guards
- modules
- pipes
- interfaces
- enums
- classes, functions, and variables that follow the "Rule of One"

## How to use

Right-click the Angular file or its associated sibling file (.html, .scss, .spec.ts).

Click 'Rename Angular file' and then enter a new name.

The extension converts the text you enter into kebab case for the filename, capital case for the class name, the correct case for the type of selector, and then adds all the existing prefixes and suffixes back on.

Note: There is a default option that assumes your project uses Standalone components. Please see 'Extension Settings' below for further info.

![Rename Angular Component in action](https://cdn.jsdelivr.net/gh/tomwhite007/rename-angular-component@main/assets/rename-angular-component-demo.gif)

## Features

Based on the same naming convention in the [Angular Style Guide](https://angular.dev/style-guide) and following the file pattern created by the Angular CLI, this extension will:

- Rename the files files associated with the component, directive or service whilst retaining their original suffixes
- Rename the containing folder if it has the same name as the original file selected
- Rename the class name of the component, directive or service to match the new file name (provided the class name follows the same naming convention)
- Rename the element, attribute or class selectors inside the class decorator meta data, and in all html templates in the repo (provided the selector follows the correct naming convention)
- Fix all import paths and their class names
- **Angular 20 compatibility**: Automatically handles the transition between old '.component' suffix and new no-suffix format
- **Enhanced selector updates**: Standalone component mode updates selectors only where the component is imported
- **Expanded file support**: Rename any Angular CLI-generated file following the "Rule of One" principle

_Example - Changes to Component file after rename:_

![Changes to Component file after rename](https://cdn.jsdelivr.net/gh/tomwhite007/simple-reactive-viewmodel-example@master/src/assets/diff-component-decorator-meta-changes.png)

_Example - Changes to an element selector in a parent template:_

![Changes to Component file after rename](https://cdn.jsdelivr.net/gh/tomwhite007/simple-reactive-viewmodel-example@master/src/assets/diff-template-selector-changed.png)

## Extension Settings

This extension contributes the following settings:

- `renameAngularComponent.debugLog`: Enable/disable debug logging to file for optional submission with new issue posts
- `renameAngularComponent.useLocalDirectPaths`: Update imports/exports with direct local paths even if wildcard path exists
- `renameAngularComponent.followAngular20FolderAndSelectorNamingConvention`: Since Angular 20.x, CLI generated folder names include any dot-suffix you type in the folder name, and the selector - which breaks the build. When this option is set to false, the Renamer generates the folder name, and selector without the dot-suffix (this is the default setting).
- `renameAngularComponent.projectUsesStandaloneComponentsOnly`: Untick this if your project uses Modules. Then all selectors will be updated in templates, instead of just the Components that import the renamed Component. But note, unticking this option means that any duplicate selectors will get updated as well.
- `renameAngularComponent.showWhatsNewPopup`: Show the 'What's New' screen when the extension is updated to a new version

## Known Issues

1. [Feature request: Limit rename selector in templates to VSCode's current workspace multi-folder root](https://github.com/tomwhite007/rename-angular-component/issues/48)
1. [Extension does not support WSL](https://github.com/tomwhite007/rename-angular-component/issues/28)

## Support

If you have a problem using the extension or you find a bug, please [raise an issue](https://github.com/tomwhite007/rename-angular-component/issues)

## Thanks

Thanks to [Max Mumford](https://github.com/maxmumford) for help finding bugs after initial release.

Thanks to [Aristeidis Bampakos](https://github.com/bampakoa) for feature guidance.

Thanks to you for reading this.

## Release Notes

Latest version: [4.0.0] - 2025-09-10

- **Angular 20 compatibility**: Support for new no-suffix component format and automatic '.component' suffix handling
- **Enhanced selector updates**: Standalone component mode with configurable template update behavior
- **Expanded file support**: Rename pipes, interfaces, enums, and any Angular CLI-generated file
- **Improved selector management**: Automatic removal of '.component' from selectors and folders per Angular 20 conventions
