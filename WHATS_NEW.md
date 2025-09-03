<div style="display: flex; align-items: center; gap: 20px; margin-bottom: 30px;">
  <img src="https://cdn.jsdelivr.net/gh/tomwhite007/rename-angular-component@main/assets/rename-angular-component-icon.png" height="120">
  <div>
    <h1 style="margin: 0; border-bottom: none;">Rename Angular Component - updated</h1>
    <p style="margin: 0 0 5px 0;">tomwhite007</p>
    <p style="margin: 0;">Rename Angular Components, Directives, Pipes and Services (plus any other Angular files)</p>
  </div>
</div>

## 🎉 Welcome to version 4.0.0

Thank you for installing the latest version of Rename Angular Component.

## ✨ New Features

### 👍 Angular 20 Style Guide and old '.component' suffix

- **Component suffix can be removed or added**: This extension now allows you to migrate in either direction between the old **'.component'** and the new no-suffix format.
- **Any dot-suffix can used for rename**: Have you ever wanted to add **'.page'** or **'.facade'** as the suffix on a component or service? Now you can - in one step.
- **Coming soon...** A migration script to [convert all existing **'.component'** files](https://github.com/tomwhite007/rename-angular-component/issues/56) in your project to the new Angular 20 suffix-less format in a single operation.

### 🌈 Enhanced Selector updates

- **Standalone Component mode**: This default setting updates selectors only in templates where the renamed component is imported. If your project still uses Modules, it can be switched to update all templates.
- **Pipes are also updated in templates**: Pipes can now be renamed using this extension.

### ⚡ Now you can rename anything in an Angular project

- **All Angular CLI-generated files**: Supports renaming classes, functions, variables, interfaces, and enums that share the same name as their containing file.
- **One concept per file**: Follows the [Angular style guide principle](https://angular.dev/style-guide#one-concept-per-file) and expects to rename one primary concept per file that matches the file name; "The Rule of One".

## 📋 How to Use

1. **Right-click** on any Angular file in the explorer
2. Select **Rename Angular file** from the context menu
3. Enter the new name when prompted (include a dot-suffix if you want to follow the old style guide)
4. The extension automatically updates all related files, selectors, and imports

## 🙈 Don't want a "What's new" popup again?

That's ok, you can disable it in settings, or choose command: `Rename Angular Component: Disable What's New popup`

## 🆘 Need Help or found a bug?

- **GitHub Issues**: Report bugs or request features on [GitHub](https://github.com/tomwhite007/rename-angular-component/issues). This is a major release, so you can expect a same-day response.
- **Documentation**: Check the [README](https://github.com/tomwhite007/rename-angular-component#readme) for detailed usage instructions
- **Configuration**: Customize the extension behavior in VS Code settings

---

**Thank you for using Rename Angular Component!** 🚀

If you find this extension helpful, please consider giving it a ⭐ on the VS Code marketplace or [GitHub](https://github.com/tomwhite007/rename-angular-component).
