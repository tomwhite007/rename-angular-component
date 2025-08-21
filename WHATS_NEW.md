<div style="display: flex; align-items: center; gap: 20px; margin-bottom: 30px;">
  <img src="https://cdn.jsdelivr.net/gh/tomwhite007/rename-angular-component@main/assets/rename-angular-component-icon.png" height="120">
  <div>
    <h1 style="margin: 0; border-bottom: none;">Rename Angular Component - updated</h1>
    <p style="margin: 0 0 5px 0;">tomwhite007</p>
    <p style="margin: 0;">Rename Angular Components, Directives, Pipes and Services (plus any other Angular files)</p>
  </div>
</div>

## 🎉 Welcome to version 4.0.0

Thank you for updating to the latest version of Rename Angular Component.

## ✨ New Features

### Angular 20 Style Guide and old '.component' suffix

- **Component suffix can be removed or added**: This extension now allows you to migrate between the old **'.component'** and new no-suffix format.
- **'.component' suffix removed from selectors**: This extension removes the suffix from selectors by default during a rename, (but can be configured to follow Angular 20 exactly). Angular 20 now puts **'.component'** into selectors if you try adding them with the cli (which breaks the build).
- **'.component' suffix removed from folders**: This extension removes this part from folders by default during a rename, (but can be configured to follow Angular 20). Angular 20 now puts **'.component'** into folders if you try adding them with the cli.
- **Coming soon...** A script to migrate all old **'.component'** files in your project in one go (if that's what you'd like to do).

### Enhanced Selector updates

- **Standalone Component mode**: This setting only updates selectors in templates where the renamed component is imported. But can be configured to update all templates, for use where UI components in Modules are still being used in a project.
- **Pipes are also updated in templates**: Pipes can now be renamed with this extension.

## ⚡ More Renamers

### You can now rename anything in an Angular project

- **All Angular CLI-generated files**: Supports renaming classes, functions, variables, interfaces, and enums that have the same name as the file they are in.
- **One concept per file**: Expects to rename [one important thing per file](https://angular.dev/style-guide#one-concept-per-file) that has the same name as the file. "The Rule of One"

## 📋 How to Use

1. **Right-click** on any Angular file in the explorer.
2. Choose **Rename Angular file** from the top of the menu.
3. Enter the new name when prompted (with a dot-suffix if you feel old-school).
4. The extension will automatically update all related files, selectors and imports.

## 🆘 Need Help or found a bug?

- **GitHub Issues**: Report bugs or request features on [GitHub](https://github.com/tomwhite007/rename-angular-component/issues). This is a big new release so you can expect a same-day response.
- **Documentation**: Check the [README](https://github.com/tomwhite007/rename-angular-component#readme) for detailed usage instructions
- **Configuration**: Customize the extension behavior in VS Code settings

---

**Thank you for using Rename Angular Component!** 🚀

If you find this extension helpful, please consider giving it a ⭐ on the VS Code marketplace or GitHub.
