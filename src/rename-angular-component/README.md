# rename-angular-component

This extension uses a heavily adapted version of the Indexer feature from [Move TS](https://marketplace.visualstudio.com/items?itemName=stringham.move-ts) VS Code extension. By indexing all file imports, _and import identifiers_ (new feature added in this project), before the run - the process is much quicker.

Once running, the process then uses Angular CLI's Selector validation, and string manipulators; classify and dasherize, to define the new file, class and Selectors.

The core file to follow the processes is `renamer.class.ts` in this folder. The extension shell triggers the method, `rename()` in this class file.
