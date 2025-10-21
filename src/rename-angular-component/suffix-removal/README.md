<div style="display: flex; align-items: center; gap: 20px; margin-bottom: 30px;">
  <img src="https://cdn.jsdelivr.net/gh/tomwhite007/rename-angular-component@main/assets/rename-angular-component-icon.png" height="120">
  <div>
    <h1 style="margin: 0; border-bottom: none;">Angular Suffix Removal Script</h1>
    <p style="margin: 0 0 5px 0;">tomwhite007</p>
    <p style="margin: 0;">Remove all Angular legacy suffixes</p>
  </div>
</div>

## 🎉 NOTE: Suffix Removal Feature is still Experimental

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

## Example

For a file `app.component.ts` with class `AppComponent`:

- Input suffix: `component`
- Result: File renamed to `app.ts` with class renamed to `App`
- All imports and references are updated automatically
