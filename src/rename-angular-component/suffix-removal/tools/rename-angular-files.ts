import * as fs from 'fs';
import * as path from 'path';

interface ChangeRecord {
  type: 'rename' | 'update_references' | 'update_class_name';
  from?: string;
  to?: string;
  file?: string;
  className?: string;
  newClassName?: string;
}

/**
 * Script to rename Angular files by removing a specified suffix (e.g., .component, .service, .directive)
 * and update all references throughout the project, including class names.
 *
 * Usage: npx ts-node rename-angular-files.ts <suffix> [--dry-run]
 * Example: npx ts-node rename-angular-files.ts component
 * Example: npx ts-node rename-angular-files.ts service --dry-run
 */

class AngularFileRenamer {
  private suffix: string;
  private dryRun: boolean;
  private projectRoot: string;
  private changes: ChangeRecord[] = [];
  private readonly fileExtensions = [
    '.ts',
    '.html',
    '.scss',
    '.css',
    '.sass',
    '.less',
    '.spec.ts',
  ];

  constructor(suffix: string, dryRun: boolean = false) {
    this.suffix = suffix;
    this.dryRun = dryRun;
    this.projectRoot = process.cwd();
  }

  /**
   * Main execution method
   */
  async execute(): Promise<void> {
    console.log(`🔄 Starting rename operation for suffix: "${this.suffix}"`);
    if (this.dryRun) {
      console.log('🔍 Running in dry-run mode - no files will be modified');
    }
    console.log('');

    try {
      // Find all files with the specified suffix
      const filesToRename = this.findFilesWithSuffix();

      if (filesToRename.length === 0) {
        console.log(`❌ No files found with suffix "${this.suffix}"`);
        return;
      }

      console.log(`📁 Found ${filesToRename.length} files to rename:`);
      filesToRename.forEach((file) => console.log(`   - ${file}`));
      console.log('');

      // Group files by their base name (without suffix)
      const fileGroups = this.groupFilesByBaseName(filesToRename);

      // Process each group
      for (const [baseName, files] of Object.entries(fileGroups)) {
        await this.processFileGroup(baseName, files);
      }

      // Update all import statements and references
      await this.updateAllReferences();

      // Summary
      this.printSummary();
    } catch (error) {
      console.error(
        '❌ Error during rename operation:',
        (error as Error).message
      );
      process.exit(1);
    }
  }

  /**
   * Find all files with the specified suffix
   */
  private findFilesWithSuffix(): string[] {
    const files: string[] = [];

    const searchDirectory = (dir: string): void => {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !this.shouldSkipDirectory(item)) {
          searchDirectory(fullPath);
        } else if (stat.isFile() && this.hasSuffix(item)) {
          files.push(fullPath);
        }
      }
    };

    searchDirectory(this.projectRoot);
    return files;
  }

  /**
   * Check if a directory should be skipped
   */
  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = ['node_modules', 'dist', '.git', 'coverage', '.angular'];
    return skipDirs.includes(dirName);
  }

  /**
   * Check if a file has the specified suffix
   */
  private hasSuffix(fileName: string): boolean {
    const nameWithoutExt = path.parse(fileName).name;
    // Check if the filename contains the suffix pattern (e.g., .component)
    // This handles cases like app.component.ts, app.component.spec.ts, etc.
    return nameWithoutExt.includes(`.${this.suffix}`);
  }

  /**
   * Group files by their base name (without suffix)
   */
  private groupFilesByBaseName(files: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};

    for (const file of files) {
      const parsed = path.parse(file);
      // Remove the suffix pattern from the filename
      // This handles cases like app.component.ts -> app.ts, app.component.spec.ts -> app.spec.ts
      const baseName = parsed.name.replace(`.${this.suffix}`, '');
      const key = path.join(parsed.dir, baseName);

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(file);
    }

    return groups;
  }

  /**
   * Process a group of related files
   */
  private async processFileGroup(
    baseName: string,
    files: string[]
  ): Promise<void> {
    console.log(`📦 Processing group: ${baseName}`);

    // Find the main TypeScript file to extract class name
    const mainTsFile = files.find((f) => f.endsWith(`.${this.suffix}.ts`));
    let className: string | null = null;
    let newClassName: string | null = null;

    if (mainTsFile) {
      const classInfo = this.extractClassName(mainTsFile);
      if (classInfo) {
        className = classInfo.className;
        newClassName = classInfo.newClassName;
        const nameType = ['guard', 'interceptor', 'resolver'].includes(
          this.suffix
        )
          ? 'Function'
          : 'Class';
        console.log(`   🏷️  ${nameType}: ${className} → ${newClassName}`);
      } else if (
        [
          'class',
          'enum',
          'interface',
          'pipe',
          'module',
          'guard',
          'interceptor',
          'resolver',
        ].includes(this.suffix)
      ) {
        console.log(
          `   📝 File-only rename (no name change for ${this.suffix} files)`
        );
      }
    }

    for (const file of files) {
      const parsed = path.parse(file);

      // Special handling for pipe, module, guard, interceptor, resolver
      // Replace .type with -type (dot to dash)
      let newFileName: string;
      if (
        ['pipe', 'module', 'guard', 'interceptor', 'resolver'].includes(
          this.suffix
        )
      ) {
        newFileName =
          parsed.name.replace(`.${this.suffix}`, `-${this.suffix}`) +
          parsed.ext;
      } else {
        newFileName = parsed.name.replace(`.${this.suffix}`, '') + parsed.ext;
      }

      const newFilePath = path.join(parsed.dir, newFileName);

      console.log(`   ${path.basename(file)} → ${newFileName}`);

      if (!this.dryRun) {
        // Rename the file
        fs.renameSync(file, newFilePath);
        this.changes.push({
          type: 'rename',
          from: file,
          to: newFilePath,
        });

        // Update class name in the main TypeScript file
        if (file === mainTsFile && className && newClassName) {
          this.updateClassNameInFile(newFilePath, className, newClassName);
        }
      }
    }
    console.log('');
  }

  /**
   * Extract class or function name from a TypeScript file
   */
  private extractClassName(
    filePath: string
  ): { className: string; newClassName: string } | null {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // For class, enum, and interface files, the names don't include the suffix
      // so we don't need to rename the class/enum/interface names
      if (['class', 'enum', 'interface'].includes(this.suffix)) {
        return null;
      }

      // For pipe, module, guard, interceptor, resolver files, the names already have the correct suffix
      // so we don't need to rename them (we only change the file extension from .type to -type)
      if (
        ['pipe', 'module', 'guard', 'interceptor', 'resolver'].includes(
          this.suffix
        )
      ) {
        return null;
      }

      // Look for export class declarations
      const classRegex = new RegExp(
        `export\\s+class\\s+(\\w*${this.capitalize(this.suffix)})\\b`,
        'g'
      );
      const classMatch = classRegex.exec(content);

      if (classMatch) {
        const className = classMatch[1];
        const newClassName = className.replace(
          new RegExp(`${this.capitalize(this.suffix)}$`),
          ''
        );
        return { className, newClassName };
      }

      // For guard, interceptor, and resolver files, also check for function names
      if (['guard', 'interceptor', 'resolver'].includes(this.suffix)) {
        // Look for export function declarations
        const functionRegex = new RegExp(
          `export\\s+(?:const\\s+)?(\\w*${this.capitalize(
            this.suffix
          )})\\s*[=:]`,
          'g'
        );
        const functionMatch = functionRegex.exec(content);

        if (functionMatch) {
          const functionName = functionMatch[1];
          const newFunctionName = functionName.replace(
            new RegExp(`${this.capitalize(this.suffix)}$`),
            ''
          );
          return { className: functionName, newClassName: newFunctionName };
        }
      }

      return null;
    } catch (error) {
      console.warn(
        `⚠️  Warning: Could not extract class/function name from ${filePath}: ${
          (error as Error).message
        }`
      );
      return null;
    }
  }

  /**
   * Update class or function name in a file
   */
  private updateClassNameInFile(
    filePath: string,
    oldClassName: string,
    newClassName: string
  ): void {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let newContent = content;
      let hasChanges = false;

      // Update class declaration
      const classDeclarationRegex = new RegExp(
        `export\\s+class\\s+${oldClassName}\\b`,
        'g'
      );
      newContent = newContent.replace(classDeclarationRegex, (match) => {
        hasChanges = true;
        return match.replace(oldClassName, newClassName);
      });

      // Update function declaration (for guards, interceptors, resolvers)
      const functionDeclarationRegex = new RegExp(
        `export\\s+(?:const\\s+)?${oldClassName}\\s*[=:]`,
        'g'
      );
      newContent = newContent.replace(functionDeclarationRegex, (match) => {
        hasChanges = true;
        return match.replace(oldClassName, newClassName);
      });

      // Update implements clauses and other references
      const implementsRegex = new RegExp(`\\b${oldClassName}\\b`, 'g');
      newContent = newContent.replace(implementsRegex, (match) => {
        hasChanges = true;
        return match.replace(oldClassName, newClassName);
      });

      if (hasChanges) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        this.changes.push({
          type: 'update_class_name',
          file: filePath,
          className: oldClassName,
          newClassName: newClassName,
        });
        const nameType = ['guard', 'interceptor', 'resolver'].includes(
          this.suffix
        )
          ? 'function'
          : 'class';
        console.log(
          `   ✅ Updated ${nameType} name in ${path.relative(
            this.projectRoot,
            filePath
          )}`
        );
      }
    } catch (error) {
      console.warn(
        `⚠️  Warning: Could not update class/function name in ${filePath}: ${
          (error as Error).message
        }`
      );
    }
  }

  /**
   * Capitalize first letter of a string
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Update all references to the renamed files and classes
   */
  private async updateAllReferences(): Promise<void> {
    console.log('🔗 Updating references...');

    // Find all TypeScript and JavaScript files
    const allFiles = this.findAllSourceFiles();

    for (const file of allFiles) {
      await this.updateFileReferences(file);
    }
  }

  /**
   * Find all source files that might contain references
   */
  private findAllSourceFiles(): string[] {
    const files: string[] = [];

    const searchDirectory = (dir: string): void => {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !this.shouldSkipDirectory(item)) {
          searchDirectory(fullPath);
        } else if (stat.isFile() && this.isSourceFile(item)) {
          files.push(fullPath);
        }
      }
    };

    searchDirectory(this.projectRoot);
    return files;
  }

  /**
   * Check if a file is a source file that might contain references
   */
  private isSourceFile(fileName: string): boolean {
    const ext = path.extname(fileName);
    return ['.ts', '.js', '.json'].includes(ext);
  }

  /**
   * Update references in a single file
   */
  private async updateFileReferences(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let newContent = content;
      let hasChanges = false;

      // Update import statements
      const importRegex = new RegExp(
        `from\\s+['"]([^'"]*\\.${this.suffix})['"]`,
        'g'
      );
      newContent = newContent.replace(importRegex, (match, importPath) => {
        const newImportPath = importPath.replace(`.${this.suffix}`, '');
        hasChanges = true;
        return match.replace(importPath, newImportPath);
      });

      // Update templateUrl and styleUrls in @Component decorators
      const templateUrlRegex = new RegExp(
        `templateUrl:\\s*['"]([^'"]*\\.${this.suffix}\\.[^'"]*)['"]`,
        'g'
      );
      newContent = newContent.replace(templateUrlRegex, (match, url) => {
        const newUrl = url.replace(`.${this.suffix}`, '');
        hasChanges = true;
        return match.replace(url, newUrl);
      });

      const styleUrlsRegex = new RegExp(
        `styleUrls:\\s*\\[\\s*['"]([^'"]*\\.${this.suffix}\\.[^'"]*)['"]\\s*\\]`,
        'g'
      );
      newContent = newContent.replace(styleUrlsRegex, (match, url) => {
        const newUrl = url.replace(`.${this.suffix}`, '');
        hasChanges = true;
        return match.replace(url, newUrl);
      });

      // Update styleUrls arrays with multiple files
      const styleUrlsArrayRegex = new RegExp(
        `styleUrls:\\s*\\[([^\\]]*)\\]`,
        'g'
      );
      newContent = newContent.replace(
        styleUrlsArrayRegex,
        (match, arrayContent) => {
          const newArrayContent = arrayContent.replace(
            new RegExp(`(['"][^'"]*\\.${this.suffix}\\.[^'"]*['"])`, 'g'),
            (fileMatch: string) => fileMatch.replace(`.${this.suffix}`, '')
          );
          if (newArrayContent !== arrayContent) {
            hasChanges = true;
            return match.replace(arrayContent, newArrayContent);
          }
          return match;
        }
      );

      // Update require() statements
      const requireRegex = new RegExp(
        `require\\(['"]([^'"]*\\.${this.suffix})['"]\\)`,
        'g'
      );
      newContent = newContent.replace(requireRegex, (match, requirePath) => {
        const newRequirePath = requirePath.replace(`.${this.suffix}`, '');
        hasChanges = true;
        return match.replace(requirePath, newRequirePath);
      });

      // Update class name references in imports and declarations
      const classChanges = this.changes.filter(
        (c) => c.type === 'update_class_name'
      );
      for (const change of classChanges) {
        if (change.className && change.newClassName) {
          const classReferenceRegex = new RegExp(
            `\\b${change.className}\\b`,
            'g'
          );
          const newContentWithClassUpdate = newContent.replace(
            classReferenceRegex,
            (match) => {
              hasChanges = true;
              return match.replace(change.className!, change.newClassName!);
            }
          );
          newContent = newContentWithClassUpdate;
        }
      }

      if (hasChanges && !this.dryRun) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        this.changes.push({
          type: 'update_references',
          file: filePath,
        });
        console.log(
          `   ✅ Updated references in ${path.relative(
            this.projectRoot,
            filePath
          )}`
        );
      } else if (hasChanges && this.dryRun) {
        console.log(
          `   🔍 Would update references in ${path.relative(
            this.projectRoot,
            filePath
          )}`
        );
      }
    } catch (error) {
      console.warn(
        `⚠️  Warning: Could not process ${filePath}: ${
          (error as Error).message
        }`
      );
    }
  }

  /**
   * Print summary of changes
   */
  private printSummary(): void {
    console.log('');
    console.log('📊 Summary:');

    const renameCount = this.changes.filter((c) => c.type === 'rename').length;
    const updateCount = this.changes.filter(
      (c) => c.type === 'update_references'
    ).length;
    const classUpdateCount = this.changes.filter(
      (c) => c.type === 'update_class_name'
    ).length;

    console.log(`   📁 Files renamed: ${renameCount}`);
    console.log(`   🏷️  Class names updated: ${classUpdateCount}`);
    console.log(`   🔗 Files with updated references: ${updateCount}`);
    console.log(`   📝 Total changes: ${this.changes.length}`);

    if (this.dryRun) {
      console.log('');
      console.log('🔍 This was a dry run. No files were actually modified.');
      console.log('   Run without --dry-run to apply the changes.');
    } else {
      console.log('');
      console.log('✅ Rename operation completed successfully!');
    }
  }
}

// CLI handling
function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node tools/dist/rename-angular-files.js <suffix> [--dry-run]

Arguments:
  suffix     The suffix to remove from filenames and class names (e.g., component, service, directive)
  --dry-run  Preview changes without modifying files

Examples:
  node tools/dist/rename-angular-files.js component
  node tools/dist/rename-angular-files.js service --dry-run
  node tools/dist/rename-angular-files.js directive

This script will:
1. Find all files with the specified suffix (e.g., .component.ts, .component.html, etc.)
2. Rename them by removing the suffix (e.g., app.component.ts → app.ts)
3. Update class/function names by removing the suffix (e.g., AppComponent → App)
   Note: For class, enum, interface, pipe, module, guard, interceptor, and resolver files, only file names are renamed
4. Update all import statements, templateUrl, styleUrls, and other references
5. Handle TypeScript, HTML, CSS, SCSS, SASS, LESS, and spec files
`);
    process.exit(0);
  }

  const suffix = args[0];
  const dryRun = args.includes('--dry-run');

  if (!suffix) {
    console.error('❌ Error: Please specify a suffix to remove');
    process.exit(1);
  }

  const renamer = new AngularFileRenamer(suffix, dryRun);
  renamer.execute().catch((error) => {
    console.error('❌ Fatal error:', (error as Error).message);
    process.exit(1);
  });
}

if (require.main === module) {
  main();
}

export default AngularFileRenamer;
