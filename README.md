<h1>
  <sub><img src="https://cdn.jsdelivr.net/gh/tomwhite007/rename-angular-component@main/assets/rename-angular-component-icon.png" height="40"></sub>
  Rename Angular Component
</h1>

Rename Angular components, directives, and services - including their filenames, class names, and selectors - all in one go

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

1. Right-click the Angular file or its associated sibling file (.html, .scss, .css, .spec.ts).

2. Click 'Rename Angular file', and then enter a new name (include a dot-suffix if you want to follow the old style guide).

3. The extension converts the text you enter into kebab-case for the filename, PascalCase for the class name, the correct case for the type of selector, and then adds all the existing prefixes and suffixes back on.

Note: There is a default option that assumes your project uses standalone components. Please see `Extension Settings` below for further info if your project uses modules.

_Example - Renaming an old Component to the newer Angular 20 suffixless format:_

<img src="https://cdn.jsdelivr.net/gh/tomwhite007/rename-angular-component@ng-20-assets/assets/rename-angular-component-demo.gif" alt="Rename Angular Component in action" width="900"/>

## Features

Based on the same naming convention in the [Angular Style Guide](https://angular.dev/style-guide) and following the file pattern created by the Angular CLI, this extension will:

- Rename the files associated with the component, directive or service whilst retaining their original suffixes
- Rename the containing folder if it has the same name as the original file selected
- Rename the class name of the component, directive or service to match the new file name (provided the class name follows the same naming convention)
- Rename the element, attribute or class selectors inside the class decorator metadata, and in all HTML templates in the repository (provided the selector follows the correct naming convention)
- Fix all import paths and their class names
- **Angular 20 compatibility**: Automatically handles the transition between old '.component' suffix and new no-suffix format, or vice versa
- **Enhanced selector updates**: Standalone Component mode updates selectors only where the component is imported
- **Expanded file support**: Rename any Angular CLI-generated file following the "Rule of One" principle

_Example - Changes to Component file after rename:_

![Changes to Component file after rename](https://cdn.jsdelivr.net/gh/tomwhite007/rename-angular-component@ng-20-assets/assets/diff-component-decorator-meta-changed.png)

_Example - Changes to an element selector in a parent template:_

![Changes to a consumer template file after rename](https://cdn.jsdelivr.net/gh/tomwhite007/rename-angular-component@ng-20-assets/assets/diff-consumer-template-selector-changed.png)

## Extension Settings

This extension contributes the following settings:

- `renameAngularComponent.projectUsesStandaloneComponentsOnly`: Uncheck this if your project uses Modules. Then all selectors will be updated in **all** templates, instead of just the components that import the renamed component. Note: unchecking this option means that any duplicate selectors in your repository will get updated as well.
- `renameAngularComponent.followAngular20FolderAndSelectorNamingConvention`: Since Angular 20.x, CLI-generated folder names include any dot-suffix you type in the folder name, and the selector - which breaks the build. When this option is set to false, the renamer generates the folder name and selector without the dot-suffix (this is the default setting, to allow you to convert new components to the old suffix format if you want to).
- `renameAngularComponent.useLocalDirectPaths`: Update imports/exports with direct local paths even if wildcard path exists
- `renameAngularComponent.showWhatsNewPopup`: Show the 'What's New' screen when the extension is updated to a new version
- `renameAngularComponent.debugLog`: Enable/disable debug logging to file for optional submission with new issue reports

## Known Issues

1. [Extension does not support WSL](https://github.com/tomwhite007/rename-angular-component/issues/28)
2. [Does not work in a VS Code devcontainer](https://github.com/tomwhite007/rename-angular-component/issues/52)

## Support

If you have a problem using the extension or you find a bug, please [raise an issue](https://github.com/tomwhite007/rename-angular-component/issues), rather than leaving a negative review. We fix bugs and give you credit for finding them.

## Thanks

Thanks to you for reading this. Contributions are welcome.

Thanks to [Aristeidis Bampakos GDE](https://github.com/bampakoa) for raising issue [34](https://github.com/tomwhite007/rename-angular-component/issues/34) (feature added in Version 3.0.0)

Thanks to [@hablix](https://github.com/hablix) for raising issue [29](https://github.com/tomwhite007/rename-angular-component/issues/29) (fixed in Version 2.1.3), with thanks also to [@elmehdielhamdi](https://github.com/elmehdielhamdi) and [@MohRaouf](https://github.com/MohRaouf)

## Release Notes

Latest version: 4.0.0 - 2025-09-10

- **Angular 20 compatibility**: Support for new no-suffix component format and automatic '.component' suffix handling
- **Enhanced selector updates**: Standalone component mode with configurable template update behavior
- **Expanded file support**: Rename pipes, interfaces, enums, and any Angular CLI-generated file
- **Improved selector management**: Automatic removal of '.component' from renamed selectors and folders for backward compatibility
