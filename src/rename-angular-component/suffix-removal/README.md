# Suffix Removal Feature

This feature provides a VS Code command to rename Angular files by removing suffixes (like `.component`, `.service`, `.directive`) to follow Angular v20 styleguide conventions.

## Usage

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Search for "Rename all Angular suffixes to v20 styleguide"
3. Enter the suffix you want to remove (e.g., `component`, `service`, `directive`)
4. Choose whether to preview changes (dry run) or apply them

## Features

- **Interactive Input**: Prompts for the suffix to remove
- **Dry Run Mode**: Preview changes before applying them
- **Comprehensive Updates**: Updates file names, class names, imports, and references
- **Progress Tracking**: Shows progress during the operation
- **Output Display**: Shows detailed results in a new document

## Supported Suffixes

The script supports removing various Angular suffixes:

- `component` - Removes `.component` from files and class names
- `service` - Removes `.service` from files and class names
- `directive` - Removes `.directive` from files and class names
- `pipe` - Removes `.pipe` from files (converts to `-pipe`)
- `module` - Removes `.module` from files (converts to `-module`)
- `guard` - Removes `.guard` from files (converts to `-guard`)
- `interceptor` - Removes `.interceptor` from files (converts to `-interceptor`)
- `resolver` - Removes `.resolver` from files (converts to `-resolver`)
- `class`, `enum`, `interface` - File-only renames (no class name changes)

## Updating the Tools

To update the suffix removal tools from the external source:

```bash
yarn update-suffix-tools
```

This copies the latest version of the tools from `/Users/tom/Development/vscode-ext/_rename-test-spas/test-rename-spa/tools/`.

## Example

For a file `app.component.ts` with class `AppComponent`:

- Input suffix: `component`
- Result: File renamed to `app.ts` with class renamed to `App`
- All imports and references are updated automatically
