<div style="display: flex; align-items: center; gap: 20px; margin-bottom: 30px;">
  <img src="https://cdn.jsdelivr.net/gh/tomwhite007/rename-angular-component@main/assets/rename-angular-component-icon.png" height="120">
  <div>
    <h1 style="margin: 0; border-bottom: none;">Angular Suffix Removal Script</h1>
    <p style="margin: 0 0 5px 0;">tomwhite007</p>
    <p style="margin: 0;">Remove all Angular legacy suffixes</p>
  </div>
</div>

This feature provides a VS Code command to rename Angular files by removing suffixes (like `.component`, `.service`, `.directive`) to follow Angular v20 styleguide conventions.

> **💡 Tip:** This README automatically opens when you run the suffix removal command. To disable this behavior, set `renameAngularComponent.showSuffixRemovalReadme` to `false` in your VS Code settings.

## ⚠️ Note: Please make sure you can revert changes using Git before you begin

This script applies changes to the entire repo, which can lead to too many namespace collisions on large projects.

Namespace collisions occur when two Angular files, like `UserService` and `UserComponent`, have their suffix removed, which results in an import to `inject(User)` inside a class named `User`. You can filter these out using the prefix filter described below, but it won't scale very well because of the data-entry required. You can follow [this discussion thread for more info](https://github.com/tomwhite007/rename-angular-component/discussions/61).

## 🛠️ Usage

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Search for "Rename all Angular suffixes to v20 styleguide"
3. Enter the suffix you want to remove (e.g., `component`, `service`, `directive` or `all` if your project is quite small)
4. Enter a comma-separated list of file prefixes to exclude from renaming, to prevent namespace collisions (e.g., profile.component, profile.service, user.component)
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

## After Success

Here are some considerations for next steps after you have successfully removed all your Angular suffixes and resolved any namespace collisions:

- Reorder imports to satisfy the `eslint-plugin-import-x/order.alphabetize` rule after removing file suffixes
- Add the following rules to your `eslint.config.js` to disable suffix requirements:
  - `'@angular-eslint/component-class-suffix': 'off'`
  - `'@angular-eslint/directive-class-suffix': 'off'`
- Remove any schematics that reference file suffixes from `angular.json`
- Update file paths with suffixes in the `include` and `exclude` arrays of your `tsconfig.json` files
- Update file patterns with suffixes in `.gitignore`
- Consider leaving a nice review on the VS Code / VSIX Marketplace for the Rename Angular Component extension

## 🔧 Repairing Namespace Collisions

If you encounter namespace collisions after running the suffix removal tool, you can use an AI agent to help identify and fix them systematically. Here's a prompt and strategies for effective repair:

## AI Agent Prompt

I've just run an Angular suffix removal tool that renamed files like `user.component.ts` → `user.ts` and `user.service.ts` → `user.ts`, removing suffixes from both filenames and class names. This has created namespace collisions where multiple classes now share the same name (e.g., `User` could refer to both a component and a service).

Please help me identify and fix all namespace collisions in this repository:

1. **Identify collisions:**

   - Use `git diff` to see what files were renamed and what classes were changed
   - Look for TypeScript compilation errors indicating ambiguous imports
   - Search for patterns like `inject(User)` or `new User()` where `User` could be ambiguous
   - Find files that import multiple classes with the same name from different paths

2. **For each collision:**

   - Determine which class should keep the base name (typically components keep the base name)
   - Analyze the conflicting class definitions to understand their purpose and choose semantic suffixes
   - Rename the other class(es) to include a purpose-based suffix (e.g., `UserState`, `UserDataAccess`, `UserModel`, `UserHelper` instead of generic `UserService`)
   - Update all imports, references, and dependency injection calls throughout the codebase
   - Rename the file to match the new class name using kebab-case (e.g., `UserDataAccess` → `user-data-access.ts`)

3. **Verify fixes:**

   - Run TypeScript compiler to check for remaining errors
   - Search for any remaining ambiguous references
   - Test that the application builds and runs correctly

4. **Output summary:**

   - After completing all fixes, provide a single comprehensive table listing ALL changes made (excluding individual import updates)
   - The table must be in a format that can be easily exported to a spreadsheet (CSV-compatible)
   - Include the following columns for each change:
     - **Original Name**: The class/interface name before suffix removal (e.g., `UserService`, `UserInterface`)
     - **Type**: The Angular type (component, service, directive, interface, guard, interceptor, etc.)
     - **New Name**: The new name assigned (e.g., `UserDataAccess`, `UserModel`). For unchanged items, use the actual name (e.g., `User`, `Profile`)
     - **Original File Path**: The file path before renaming (e.g., `src/app/user.service.ts`)
     - **New File Path**: The file path after renaming (e.g., `src/app/user-data-access.ts`). If the file wasn't renamed, use the same path as Original File Path
     - **Change Type**: One of: "Class Renamed", "File Renamed", "Type Alias Added", "Both Class and File Renamed", "unchanged"
     - **Files Updated Count**: Number of files that had imports/references updated (just the count, not the list)
   - Do NOT include narrative text, explanations, or lists of individual files with updated imports
   - Keep the summary concise and tabular only
   - If type aliases were used (e.g., `import { Profile as ProfileModel }`), include them as separate rows with Change Type "Type Alias Added"

   **Required output format (CSV-compatible markdown table):**

   ```
   ## Namespace Collision Fixes Summary

   | Original Name | Type      | New Name            | Original File Path                              | New File Path                               | Change Type              | Files Updated Count |
   | ------------- | --------- | ------------------- | ----------------------------------------------- | ------------------------------------------- | ------------------------ | ------------------- |
   | UserService   | service   | UserAuth            | src/app/core/auth/services/user.ts              | src/app/core/auth/services/user-auth.ts     | Both Class and File Renamed | 13                  |
   | UserInterface | interface | User                | src/app/core/auth/user.model.ts                 | src/app/core/auth/user.model.ts             | unchanged                | 0                   |
   | ProfileService | service   | ProfileDataAccess   | src/app/features/profile/services/profile.ts   | src/app/features/profile/services/profile-data-access.ts | Both Class and File Renamed | 5                   |
   | ProfileComponent | component | Profile             | src/app/features/profile/pages/profile/profile.ts | src/app/features/profile/pages/profile/profile.ts | unchanged | 0                   |
   | ProfileInterface | interface | ProfileModel        | src/app/features/profile/models/profile.model.ts | src/app/features/profile/models/profile.model.ts | Type Alias Added | 2                   |
   ```

   **Notes:**

   - For unchanged items, use the actual name (e.g., "User", "Profile") not "unchanged" in the New Name column
   - Include all classes/interfaces involved in collisions, even if they weren't renamed
   - Use "unchanged" only in the Change Type column when no changes were made
   - Count all files that had any imports or references updated, including test files

   **Important:** The summary must be ONLY the table above. Do not include narrative explanations, collision descriptions, file lists, verification details, or summary statistics. The table is the complete output.

   **CSV Export:** After providing the markdown table, offer to provide the same data as a downloadable CSV file. Format the CSV with:

   - Header row with column names: Original Name, Type, New Name, Original File Path, New File Path, Change Type, Files Updated Count
   - One row per change
   - Proper CSV escaping (quotes around fields containing commas)
   - Present it in a code block with filename suggestion (e.g., `namespace-collision-fixes.csv`)

   **Example CSV format:**

   ```
   namespace-collision-fixes.csv

   Original Name,Type,New Name,Original File Path,New File Path,Change Type,Files Updated Count
   UserService,service,UserAuth,src/app/core/auth/services/user.ts,src/app/core/auth/services/user-auth.ts,Both Class and File Renamed,13
   UserInterface,interface,User,src/app/core/auth/user.model.ts,src/app/core/auth/user.model.ts,unchanged,0
   ProfileService,service,ProfileDataAccess,src/app/features/profile/services/profile.ts,src/app/features/profile/services/profile-data-access.ts,Both Class and File Renamed,5
   ```

5. **Update inject() variable names:**

   After all namespace collisions are fixed, perform a final pass through all `*.ts` files in the repository to update variable names in `inject()` assignments:

   - Search for all `inject()` variable assignments in every `*.ts` file (e.g., `private userService = inject(User)`, `protected profileService = inject(Profile)`)
   - For each variable assignment:
     1. **Remove Angular suffix from variable name**: If the variable name contains an Angular suffix (e.g., `userService`, `profileService`), remove the Angular suffix to get the base name (e.g., `user`, `profile`)
     2. **Match to injected class name**: Update the variable name to match the injected class name in camelCase:
        - If `private userService = inject(UserDataAccess)`, rename to `private userDataAccess = inject(UserDataAccess)`
        - If `private profileService = inject(Profile)`, rename to `private profile = inject(Profile)`
        - If `private userState = inject(UserState)`, keep as `private userState = inject(UserState)` (already matches)
     3. **Update all usages**: Update the variable name everywhere it's used within the same file (method calls, property access, etc.)
   - Ensure variable names follow camelCase convention
   - Skip variables that already match their injected class name in camelCase

   **Example transformations:**

   - `private userService = inject(UserDataAccess)` → `private userDataAccess = inject(UserDataAccess)`
   - `private profileService = inject(Profile)` → `private profile = inject(Profile)`
   - `private authService = inject(UserAuth)` → `private userAuth = inject(UserAuth)`
   - `private userState = inject(UserState)` → (no change, already matches)

Please work systematically through the repository, fixing one collision at a time and verifying each fix before moving to the next.

### Strategies for Effective Collision Detection

An AI agent can use these approaches to efficiently identify and fix collisions:

#### 1. **Git Diff Analysis**

```bash
# See all renamed files
git diff --name-status HEAD

# See what class names were renamed (shows class declarations)
git diff HEAD | grep -E "^\+.*class|^\-.*class"

# Identify files that were renamed to the same name (potential collisions)
git diff --name-status HEAD | grep "^R" | sort -k3 | uniq -d -f2
```

The agent should:

- Parse the git diff to identify files that were renamed to identical names
- Map old class names to new class names
- Identify cases where `UserComponent` and `UserService` both became `User`

#### 2. **TypeScript Compiler Errors**

```bash
# Run TypeScript compiler to find type errors
npx tsc --noEmit

# Look for errors such as:
# - "Cannot find name 'User'" (ambiguous reference)
# - "Module has no exported member 'User'" (multiple exports with same name)
# - "Duplicate identifier 'User'" (same class name in multiple files)
```

The agent should:

- Parse TypeScript compiler output for ambiguous reference errors
- Focus on errors in files that import or use the colliding classes
- Use the error locations to identify which files need fixing

#### 3. **Pattern-Based Search**

```bash
# Find Angular inject() calls that might be ambiguous
grep -r "inject(" --include="*.ts" | grep -v "\.spec\.ts"

# Find imports that might conflict (adjust pattern for your base name)
grep -r "import.*from.*user" --include="*.ts" -i
```

The agent should:

- Search for `inject(ClassName)` patterns where `ClassName` appears in multiple renamed files
- Look for imports from paths that suggest different Angular types (components vs services)
- Identify files that import both a component and service with the same base name

#### 4. **File Structure Analysis**

The agent should:

- Identify files in the same directory that were renamed to the same name (this would cause a file system conflict, so one rename must have failed)
- Look for files in different directories that share the same name after renaming
- Check if the original file structure can reveal the intended type (e.g., `user.component.ts` vs `user.service.ts`)
- Use directory structure to infer purpose (e.g., files in `services/data-access/` vs `services/state/` vs `services/helpers/` can suggest appropriate suffixes)

### Fixing Strategies

When fixing collisions, the agent should:

1. **Prioritize Components**: Typically, components should keep the base name (e.g., `User`), and other types (services, directives, interfaces, etc.) should get semantic, purpose-based suffixes (e.g., `UserDataAccess`, `UserState`, `UserModel` rather than generic `UserService`, `UserDirective`)

2. **Analyze Class Purpose for Semantic Suffixes**: Instead of using generic Angular type suffixes, analyze each conflicting class to determine its actual purpose and choose a meaningful suffix:

   **For Services**, examine the class to determine its primary responsibility:

   - State management (RxJS BehaviorSubject/Subject, stores): `UserState`, `UserStore`
   - Data access (HTTP calls, API interactions): `UserDataAccess`, `UserApi`, `UserRepository`
   - Business logic/utilities: `UserHelper`, `UserUtil`, `UserCalculator`
   - Authentication/authorization: `UserAuth`, `UserPermissions`
   - If purpose is unclear or it's a general service: `UserService` (fallback)

   **For Interfaces**, consider their usage:

   - Data models/DTOs: `UserModel`, `UserDto`
   - Configuration/options: `UserConfig`, `UserOptions`
   - Types for API responses: `UserResponse`, `UserPayload`
   - If it represents domain entities: `UserEntity` or just `User` (if no collision)

   **For Directives**, analyze their behavior:

   - Structural directives (ngIf-like): `UserIf`, `UserShow`
   - Attribute directives (styling/behavior): `UserHighlight`, `UserTooltip`, `UserClick`
   - Validation directives: `UserValidator`, `UserRequired`
   - If purpose is unclear: `UserDirective` (fallback)

   **For Guards**, the purpose is usually clear from the name:

   - Authentication: `UserAuthGuard` (or keep as `UserGuard` if unambiguous)
   - Authorization: `UserPermissionsGuard`
   - Data loading: `UserDataGuard`, `UserResolveGuard`

   **For Interceptors**, consider their function:

   - Authentication: `UserAuthInterceptor`
   - Logging: `UserLoggingInterceptor`
   - Error handling: `UserErrorInterceptor`
   - If purpose is unclear: `UserInterceptor` (fallback)

   **Analysis approach:**

   - Read the class definition, methods, and properties
   - Check imports to understand dependencies (e.g., `@angular/common/http` suggests data access)
   - Look at how the class is used in the codebase (inject sites, method calls)
   - Consider the file location (e.g., `services/data-access/` vs `services/state/`)
   - Review comments or JSDoc if available

   **Example analysis:**

   ```
   Collision: UserComponent and UserService both became User

   Analysis of UserService:
   - Original file: user.service.ts
   - Imports: HttpClient, Observable
   - Methods: getUser(id), createUser(data), updateUser(id, data)
   - Location: services/data-access/user.service.ts
   - Conclusion: This is a data access service → rename to UserDataAccess

   Result:
   - UserComponent stays as User (file: user.ts)
   - UserService becomes UserDataAccess (file: user-data-access.ts)
   ```

3. **Update All References**: When renaming a class:

   - Update the class declaration
   - Update all import statements
   - Update all `inject()` calls
   - Update all type annotations
   - Update template references if applicable

4. **Rename Files Appropriately**: If a class is renamed, ensure the file name matches the new class name using kebab-case (e.g., `UserDataAccess` class should be in `user-data-access.ts`, `UserState` class should be in `user-state.ts`)

5. **Verify Incrementally**: After each fix, run the TypeScript compiler to ensure no new errors were introduced and existing errors are resolved.

6. **Update inject() Variable Names (Final Step)**: After all namespace collisions are fixed, perform a final pass to update variable names in `inject()` assignments:

   - Search through all `*.ts` files in the repository for `inject()` variable assignments
   - For each assignment found (e.g., `private userService = inject(UserDataAccess)`):
     1. **Remove Angular suffix**: If the variable name has an Angular suffix (e.g., `userService`, `profileService`), remove the Angular suffix to get the base name
     2. **Match class name**: Update the variable name to match the injected class name in camelCase:
        - Extract the class name from the `inject()` call
        - Convert to camelCase (e.g., `UserDataAccess` → `userDataAccess`, `UserAuth` → `userAuth`)
        - Update the variable name to match
     3. **Update all usages**: Find all references to the old variable name within the same file and update them
   - Skip variables that already match their injected class name in camelCase
   - Ensure all variable names follow camelCase convention

   **Examples:**

   - `private userService = inject(UserDataAccess)` → `private userDataAccess = inject(UserDataAccess)`
   - `private profileService = inject(Profile)` → `private profile = inject(Profile)`
   - `private authService = inject(UserAuth)` → `private userAuth = inject(UserAuth)`
   - `private userState = inject(UserState)` → (no change needed, already matches)
