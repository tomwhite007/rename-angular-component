# Angular File Rename Tools

This directory contains tools for renaming Angular files and updating all references throughout the project.

## Setup

First, build the tools:

```bash
npm run build-tools
```

## Usage

### Rename Component Files

To rename all `.component` files and update references:

```bash
npm run rename component
```

### Rename Service Files

To rename all `.service` files and update references:

```bash
npm run rename service
```

### Rename Directive Files

To rename all `.directive` files and update references:

```bash
npm run rename directive
```

### Rename Class Files

To rename all `.class` files (file names only, class names unchanged):

```bash
npm run rename class
```

### Rename Enum Files

To rename all `.enum` files (file names only, enum names unchanged):

```bash
npm run rename enum
```

### Rename Interface Files

To rename all `.interface` files (file names only, interface names unchanged):

```bash
npm run rename interface
```

### Rename Guard Files

To rename all `.guard` files and update function names:

```bash
npm run rename guard
```

### Rename Interceptor Files

To rename all `.interceptor` files and update function names:

```bash
npm run rename interceptor
```

### Rename Resolver Files

To rename all `.resolver` files and update function names:

```bash
npm run rename resolver
```

### Dry Run

To preview changes without modifying files:

```bash
npm run rename component --dry-run
```

## What the Script Does

1. **Finds all files** with the specified suffix (e.g., `.component.ts`, `.component.html`, `.component.scss`, etc.)
2. **Renames files** by removing the suffix (e.g., `app.component.ts` → `app.ts`)
3. **Updates class/function names** by removing the suffix (e.g., `AppComponent` → `App`)
   - **Note**: For `class`, `enum`, and `interface` files, only file names are renamed (the class/enum/interface names themselves don't include the suffix)
   - **Note**: For `pipe`, `module`, `guard`, `interceptor`, and `resolver` files, only file names are renamed (replacing `.type` with `-type`)
4. **Updates all references** including:
   - Import statements
   - `templateUrl` and `styleUrls` in `@Component` decorators
   - Router configurations
   - Module declarations
   - Test files

## Supported File Types

- `.ts` (TypeScript files)
- `.html` (Template files)
- `.scss`, `.css`, `.sass`, `.less` (Style files)
- `.spec.ts` (Test files)

## Examples

### Before

```
src/app/
├── app.component.ts
├── app.component.html
├── app.component.scss
├── app.component.spec.ts
└── products/
    ├── products.component.ts
    ├── products.component.html
    ├── products.component.scss
    └── products.component.spec.ts
```

### After running `npm run rename component`

```
src/app/
├── app.ts
├── app.html
├── app.scss
├── app.spec.ts
└── products/
    ├── products.ts
    ├── products.html
    ├── products.scss
    └── products.spec.ts
```

### Special Behavior for Class, Enum, and Interface Files

For these file types, only the **file names** are renamed, not the class/enum/interface names:

#### Before

```
src/app/
├── test.class.ts        (contains: export class Test)
├── config.enum.ts       (contains: export enum Config)
└── user.interface.ts    (contains: export interface User)
```

#### After running `npm run rename class`, `npm run rename enum`, `npm run rename interface`

```
src/app/
├── test.ts              (still contains: export class Test)
├── config.ts            (still contains: export enum Config)
└── user.ts              (still contains: export interface User)
```

### Dash-Suffix Updates for Pipes, Modules, Guards, Interceptors, and Resolvers

For these file types, **file names** are updated from dot notation to dash notation:

#### Before

```
src/app/
├── product.pipe.ts      (contains: export class ProductPipe)
├── products.module.ts   (contains: export class ProductsModule)
├── auth.guard.ts        (contains: export const AuthGuard = ...)
├── api.interceptor.ts   (contains: export const ApiInterceptor = ...)
└── user.resolver.ts     (contains: export const UserResolver = ...)
```

#### After running `npm run rename pipe`, `npm run rename module`, `npm run rename guard`, etc.

```
src/app/
├── product-pipe.ts      (contains: export class ProductPipe)
├── products-module.ts   (contains: export class ProductsModule)
├── auth-guard.ts        (contains: export const AuthGuard = ...)
├── api-interceptor.ts   (contains: export const ApiInterceptor = ...)
└── user-resolver.ts     (contains: export const UserResolver = ...)
```

## Development

To modify the tools:

1. Edit the TypeScript files in this directory
2. Run `npm run build-tools` to compile
3. Test with `npm run rename <suffix> --dry-run`
