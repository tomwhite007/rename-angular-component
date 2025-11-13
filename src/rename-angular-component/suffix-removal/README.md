<div style="display: flex; align-items: center; gap: 20px; margin-bottom: 30px;">
  <img src="https://cdn.jsdelivr.net/gh/tomwhite007/rename-angular-component@main/assets/rename-angular-component-icon.png" height="120">
  <div>
    <h1 style="margin: 0; border-bottom: none;">Angular Suffix Removal Script</h1>
    <p style="margin: 0 0 5px 0;">tomwhite007</p>
    <p style="margin: 0;">Remove all Angular legacy suffixes</p>
  </div>
</div>

This feature provides a VS Code command to rename Angular files by removing suffixes (like `.component`, `.service`, `.directive`) to follow Angular v20 styleguide conventions.

## ⚠️ Note: This feature is Experimental - please make sure you can revert changes using Git before you begin

In the future, this script will include the ability to run on a single project folder or library, but for now, it applies changes to the entire repo, which can lead to too many namespace collisions on large projects. You can follow [this discussion thread for more info](https://github.com/tomwhite007/rename-angular-component/discussions/61).

Namespace collisions occur when a two Angular files, like UserService and UserComponent have their suffix removed, which results in an import to `inject(User)` inside a class named `User`. You can filter these out using the prefix filter described below, but it won't scale very well because of the data-entry required.

## 🛠️ Usage

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Search for "Rename all Angular suffixes to v20 styleguide"
3. Enter the suffix you want to remove (e.g., `component`, `service`, `directive` or `all` if your project is quite small)
4. Enter comma-separated list of prefixes to avoid changing, to stop namespace collisions (e.g. profile.component, profile.service, user.component)
5. Choose whether to preview changes (dry run) or apply them

## 👮 Supported Suffixes

The script supports removing these Angular suffixes:

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
