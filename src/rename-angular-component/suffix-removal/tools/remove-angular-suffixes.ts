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

interface UserMessageInterface {
  logInfoToChannel(textLines: string[]): void;
}

/**
 * Script to rename Angular files by removing a specified suffix (e.g., .component, .service, .directive)
 * and update all references throughout the project, including class names.
 *
 * Usage: npx ts-node rename-angular-files.ts <suffix> [--dry-run]
 * Example: npx ts-node rename-angular-files.ts component
 * Example: npx ts-node rename-angular-files.ts service --dry-run
 */

class AngularFileSuffixRemover {
  private suffix: string;
  private dryRun: boolean;
  private projectRoot: string;
  private userMessage?: UserMessageInterface;
  private exclusionPrefixes: string[];
  public changes: ChangeRecord[] = [];
  private readonly fileExtensions = [
    '.ts',
    '.html',
    '.scss',
    '.css',
    '.sass',
    '.less',
    '.spec.ts',
  ];

  constructor(
    suffix: string,
    dryRun: boolean = false,
    userMessage?: UserMessageInterface,
    exclusionPrefixes: string[] = []
  ) {
    this.suffix = suffix;
    this.dryRun = dryRun;
    this.projectRoot = process.cwd();
    this.userMessage = userMessage;
    this.exclusionPrefixes = exclusionPrefixes;
  }

  /**
   * Log a message using userMessage if available, otherwise fallback to console.log
   */
  private log(message: string): void {
    if (this.userMessage) {
      this.userMessage.logInfoToChannel([message]);
    } else {
      console.log(message);
    }
  }

  /**
   * Check if a file should be excluded based on its filename pattern
   */
  private shouldExcludeFile(filename: string): boolean {
    if (this.exclusionPrefixes.length === 0) {
      return false;
    }

    const baseName = path.basename(filename, path.extname(filename));

    // Check if the filename matches any of the exclusion patterns
    return this.exclusionPrefixes.some((pattern) => {
      const lowerPattern = pattern.toLowerCase();
      const lowerBaseName = baseName.toLowerCase();

      // If the pattern contains a dot, treat it as an exact filename match
      if (lowerPattern.includes('.')) {
        return lowerBaseName === lowerPattern;
      }

      // Otherwise, use prefix matching (backward compatibility)
      return lowerBaseName.startsWith(lowerPattern);
    });
  }

  /**
   * Check if a file path (from import statement) should be excluded
   */
  private shouldExcludeImportPath(importPath: string): boolean {
    if (this.exclusionPrefixes.length === 0) {
      return false;
    }

    // Extract the filename from the import path (keep the full filename without directory)
    const fileName = path.basename(importPath);
    // Remove only the actual file extension (.ts, .js, etc.) but keep Angular suffixes (.component, .service, etc.)
    const baseName = this.removeFileExtension(fileName);

    // Check if the filename matches any of the exclusion patterns
    return this.exclusionPrefixes.some((pattern) => {
      const lowerPattern = pattern.toLowerCase();
      const lowerBaseName = baseName.toLowerCase();

      // If the pattern contains a dot, treat it as an exact filename match
      if (lowerPattern.includes('.')) {
        return lowerBaseName === lowerPattern;
      }

      // Otherwise, use prefix matching (backward compatibility)
      return lowerBaseName.startsWith(lowerPattern);
    });
  }

  /**
   * Main execution method
   */
  async execute(): Promise<void> {
    this.log(`🔄 Starting rename operation for suffix: "${this.suffix}"`);
    if (this.dryRun) {
      this.log('🔍 Running in dry-run mode - no files will be modified');
    }
    this.log('');

    try {
      // Find all files with the specified suffix
      const filesToRename = this.findFilesWithSuffix();

      if (filesToRename.length === 0) {
        this.log(`❌ No files found with suffix "${this.suffix}"`);
        return;
      }

      this.log(`📁 Found ${filesToRename.length} files to rename:`);
      filesToRename.forEach((file) => this.log(`   - ${file}`));
      this.log('');

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
      this.log(`❌ Error during rename operation: ${(error as Error).message}`);
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
        } else if (
          stat.isFile() &&
          this.hasSuffix(item) &&
          !this.shouldExcludeFile(fullPath)
        ) {
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
    this.log(`📦 Processing group: ${baseName}`);

    // Find the main TypeScript file to extract class name
    const mainTsFile = files.find((f) => f.endsWith(`.${this.suffix}.ts`));
    let className: string | null = null;
    let newClassName: string | null = null;

    if (mainTsFile) {
      const classInfo = this.extractClassName(mainTsFile);
      if (classInfo) {
        className = classInfo.className;
        newClassName = classInfo.newClassName;
        const nameType = classInfo.isClass ? 'Class' : 'Function';
        this.log(`   🏷️  ${nameType}: ${className} → ${newClassName}`);
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
        this.log(
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

      this.log(`   ${path.basename(file)} → ${newFileName}`);

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
          const classInfo = this.extractClassName(newFilePath);
          const isClass = classInfo?.isClass ?? true; // Default to class if not found
          this.updateClassNameInFile(
            newFilePath,
            className,
            newClassName,
            isClass
          );
        }
      }
    }
    this.log('');
  }

  /**
   * Extract class or function name from a TypeScript file
   */
  private extractClassName(
    filePath: string
  ): { className: string; newClassName: string; isClass: boolean } | null {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // For class, enum, and interface files, the names don't include the suffix
      // so we don't need to rename the class/enum/interface names
      if (['class', 'enum', 'interface'].includes(this.suffix)) {
        return null;
      }

      // For pipe and module files, check for class declarations (both are typically classes)
      if (['pipe', 'module'].includes(this.suffix)) {
        const classRegex = new RegExp(
          `export\\s+(?:default\\s+)?(?:abstract\\s+)?class\\s+(\\w*${this.capitalize(
            this.suffix
          )})\\b`,
          'g'
        );
        const classMatch = classRegex.exec(content);

        if (classMatch) {
          const className = classMatch[1];
          // For pipe and module files, keep the class name as-is (don't remove the suffix)
          return { className, newClassName: className, isClass: true };
        }

        // If no class found, return null (file-only rename)
        return null;
      }

      // For guard, interceptor, and resolver files, check for both class and function implementations
      if (['guard', 'interceptor', 'resolver'].includes(this.suffix)) {
        // First, look for export class declarations
        const classRegex = new RegExp(
          `export\\s+(?:default\\s+)?(?:abstract\\s+)?class\\s+(\\w*${this.capitalize(
            this.suffix
          )})\\b`,
          'g'
        );
        const classMatch = classRegex.exec(content);

        if (classMatch) {
          const className = classMatch[1];
          // For guard, interceptor, and resolver files, keep the class name as-is (don't remove the suffix)
          return { className, newClassName: className, isClass: true };
        }

        // If no class found, look for export function declarations
        const functionRegex = new RegExp(
          `export\\s+(?:default\\s+)?(?:const\\s+)?(\\w*${this.capitalize(
            this.suffix
          )})\\s*[=:]`,
          'g'
        );
        const functionMatch = functionRegex.exec(content);

        if (functionMatch) {
          const functionName = functionMatch[1];
          // For guard, interceptor, and resolver files, keep the function name as-is (don't remove the suffix)
          return {
            className: functionName,
            newClassName: functionName,
            isClass: false,
          };
        }

        // If neither class nor function found, return null (file-only rename)
        return null;
      }

      // For other file types (component, service, directive), look for export class declarations
      const classRegex = new RegExp(
        `export\\s+(?:default\\s+)?(?:abstract\\s+)?class\\s+(\\w*${this.capitalize(
          this.suffix
        )})\\b`,
        'g'
      );
      const classMatch = classRegex.exec(content);

      if (classMatch) {
        const className = classMatch[1];
        const newClassName = className.replace(
          new RegExp(`${this.capitalize(this.suffix)}$`),
          ''
        );
        return { className, newClassName, isClass: true };
      }

      return null;
    } catch (error) {
      this.log(
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
    newClassName: string,
    isClass: boolean = true
  ): void {
    try {
      // If the class name doesn't change, skip the update
      if (oldClassName === newClassName) {
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      let newContent = content;
      let hasChanges = false;

      if (isClass) {
        // Update class declaration
        const classDeclarationRegex = new RegExp(
          `export\\s+(?:default\\s+)?(?:abstract\\s+)?class\\s+${oldClassName}\\b`,
          'g'
        );
        newContent = newContent.replace(classDeclarationRegex, (match) => {
          hasChanges = true;
          return match.replace(oldClassName, newClassName);
        });
      } else {
        // Update function declaration (for guards, interceptors, resolvers)
        const functionDeclarationRegex = new RegExp(
          `export\\s+(?:default\\s+)?(?:const\\s+)?${oldClassName}\\s*[=:]`,
          'g'
        );
        newContent = newContent.replace(functionDeclarationRegex, (match) => {
          hasChanges = true;
          return match.replace(oldClassName, newClassName);
        });
      }

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
        const nameType = isClass ? 'class' : 'function';
        this.log(
          `   ✅ Updated ${nameType} name in ${path.relative(
            this.projectRoot,
            filePath
          )}`
        );
      }
    } catch (error) {
      this.log(
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
   * Remove only the actual file extension (.ts, .js, etc.) but keep Angular suffixes (.component, .service, etc.)
   */
  private removeFileExtension(fileName: string): string {
    // List of actual file extensions to remove
    const fileExtensions = [
      '.ts',
      '.js',
      '.html',
      '.scss',
      '.css',
      '.sass',
      '.less',
      '.spec.ts',
    ];

    for (const ext of fileExtensions) {
      if (fileName.toLowerCase().endsWith(ext.toLowerCase())) {
        return fileName.slice(0, -ext.length);
      }
    }

    // If no recognized extension found, return the original filename
    return fileName;
  }

  /**
   * Update all references to the renamed files and classes
   */
  private async updateAllReferences(): Promise<void> {
    this.log('🔗 Updating references...');

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
        // Check if this import path should be excluded
        if (this.shouldExcludeImportPath(importPath)) {
          return match; // Don't update excluded imports
        }

        let newImportPath: string;
        // For pipe, module, guard, interceptor, resolver files, replace .suffix with -suffix
        if (
          ['pipe', 'module', 'guard', 'interceptor', 'resolver'].includes(
            this.suffix
          )
        ) {
          newImportPath = importPath.replace(
            `.${this.suffix}`,
            `-${this.suffix}`
          );
        } else {
          // For other file types, remove the suffix entirely
          newImportPath = importPath.replace(`.${this.suffix}`, '');
        }
        hasChanges = true;
        return match.replace(importPath, newImportPath);
      });

      // Update templateUrl and styleUrls in @Component decorators
      const templateUrlRegex = new RegExp(
        `templateUrl:\\s*['"]([^'"]*\\.${this.suffix}\\.[^'"]*)['"]`,
        'g'
      );
      newContent = newContent.replace(templateUrlRegex, (match, url) => {
        // Check if this templateUrl should be excluded
        if (this.shouldExcludeImportPath(url)) {
          return match; // Don't update excluded templateUrls
        }
        const newUrl = url.replace(`.${this.suffix}`, '');
        hasChanges = true;
        return match.replace(url, newUrl);
      });

      const styleUrlsRegex = new RegExp(
        `styleUrls:\\s*\\[\\s*['"]([^'"]*\\.${this.suffix}\\.[^'"]*)['"]\\s*\\]`,
        'g'
      );
      newContent = newContent.replace(styleUrlsRegex, (match, url) => {
        // Check if this styleUrls should be excluded
        if (this.shouldExcludeImportPath(url)) {
          return match; // Don't update excluded styleUrls
        }
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
            (fileMatch: string) => {
              // Extract the file path from the match (remove quotes)
              const filePath = fileMatch.slice(1, -1);
              // Check if this file should be excluded
              if (this.shouldExcludeImportPath(filePath)) {
                return fileMatch; // Don't update excluded files
              }
              return fileMatch.replace(`.${this.suffix}`, '');
            }
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
        // Check if this require path should be excluded
        if (this.shouldExcludeImportPath(requirePath)) {
          return match; // Don't update excluded requires
        }

        let newRequirePath: string;
        // For pipe, module, guard, interceptor, resolver files, replace .suffix with -suffix
        if (
          ['pipe', 'module', 'guard', 'interceptor', 'resolver'].includes(
            this.suffix
          )
        ) {
          newRequirePath = requirePath.replace(
            `.${this.suffix}`,
            `-${this.suffix}`
          );
        } else {
          // For other file types, remove the suffix entirely
          newRequirePath = requirePath.replace(`.${this.suffix}`, '');
        }
        hasChanges = true;
        return match.replace(requirePath, newRequirePath);
      });

      // Update lazy loading paths in router modules and standalone router configs
      const lazyLoadRegex = new RegExp(
        `import\\(['"]([^'"]*\\.${this.suffix})['"]\\)`,
        'g'
      );
      newContent = newContent.replace(lazyLoadRegex, (match, importPath) => {
        // Check if this lazy load path should be excluded
        if (this.shouldExcludeImportPath(importPath)) {
          return match; // Don't update excluded lazy load paths
        }

        let newImportPath: string;
        // For pipe, module, guard, interceptor, resolver files, replace .suffix with -suffix
        if (
          ['pipe', 'module', 'guard', 'interceptor', 'resolver'].includes(
            this.suffix
          )
        ) {
          newImportPath = importPath.replace(
            `.${this.suffix}`,
            `-${this.suffix}`
          );
        } else {
          // For other file types, remove the suffix entirely
          newImportPath = importPath.replace(`.${this.suffix}`, '');
        }
        hasChanges = true;
        return match.replace(importPath, newImportPath);
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
        this.log(
          `   ✅ Updated references in ${path.relative(
            this.projectRoot,
            filePath
          )}`
        );
      } else if (hasChanges && this.dryRun) {
        this.log(
          `   🔍 Would update references in ${path.relative(
            this.projectRoot,
            filePath
          )}`
        );
      }
    } catch (error) {
      this.log(
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
    this.log('');
    this.log('📊 Summary:');

    const renameCount = this.changes.filter((c) => c.type === 'rename').length;
    const updateCount = this.changes.filter(
      (c) => c.type === 'update_references'
    ).length;
    const classUpdateCount = this.changes.filter(
      (c) => c.type === 'update_class_name'
    ).length;

    this.log(`   📁 Files renamed: ${renameCount}`);
    this.log(`   🏷️  Class names updated: ${classUpdateCount}`);
    this.log(`   🔗 Files with updated references: ${updateCount}`);
    this.log(`   📝 Total changes: ${this.changes.length}`);

    if (this.dryRun) {
      this.log('');
      this.log('🔍 This was a dry run. No files were actually modified.');
      this.log('   Run without --dry-run to apply the changes.');
    } else {
      this.log('');
      this.log('✅ Rename operation completed successfully!');
    }
  }
}

/**
 * Helper function to log messages in renameAllAngularFiles
 */
function logMessage(message: string, userMessage?: UserMessageInterface): void {
  if (userMessage) {
    userMessage.logInfoToChannel([message]);
  } else {
    console.log(message);
  }
}

/**
 * Wrapper function to rename all Angular file types
 */
async function removeAllAngularSuffixes(
  dryRun: boolean = false,
  userMessage?: UserMessageInterface,
  exclusionPrefixes: string[] = []
): Promise<void> {
  logMessage(
    '🚀 Starting comprehensive Angular file rename operation',
    userMessage
  );
  if (dryRun) {
    logMessage(
      '🔍 Running in dry-run mode - no files will be modified',
      userMessage
    );
  }
  logMessage('', userMessage);

  // Define all Angular file types in the order they should be processed
  // Order matters: modules should be processed last since other files might import them
  const angularTypes = [
    'component',
    'service',
    'directive',
    'pipe',
    'guard',
    'interceptor',
    'resolver',
    'module',
  ];

  let totalChanges = 0;
  let processedTypes = 0;

  for (const type of angularTypes) {
    logMessage(`\n📋 Processing ${type} files...`, userMessage);
    logMessage('='.repeat(50), userMessage);

    try {
      const renamer = new AngularFileSuffixRemover(
        type,
        dryRun,
        userMessage,
        exclusionPrefixes
      );
      await renamer.execute();

      // Count changes from the renamer's changes array
      const changes = renamer.changes?.length || 0;
      totalChanges += changes;
      processedTypes++;

      if (changes > 0) {
        logMessage(
          `✅ ${type} files processed successfully (${changes} changes)`,
          userMessage
        );
      } else {
        logMessage(`ℹ️  No ${type} files found to rename`, userMessage);
      }
    } catch (error) {
      logMessage(
        `❌ Error processing ${type} files: ${(error as Error).message}`,
        userMessage
      );
      // Continue with other types even if one fails
    }
  }

  // Summary
  logMessage('\n' + '='.repeat(50), userMessage);
  logMessage('📊 Comprehensive Rename Summary:', userMessage);
  logMessage(
    `   📁 File types processed: ${processedTypes}/${angularTypes.length}`,
    userMessage
  );
  logMessage(`   📝 Total changes made: ${totalChanges}`, userMessage);

  if (dryRun) {
    logMessage('', userMessage);
    logMessage(
      '🔍 This was a dry run. No files were actually modified.',
      userMessage
    );
    logMessage('   Run without --dry-run to apply all changes.', userMessage);
  } else {
    logMessage('', userMessage);
    logMessage(
      '✅ Comprehensive Angular file rename completed successfully!',
      userMessage
    );
  }
}

// CLI handling
function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node tools/dist/rename-angular-files.js <suffix|all> [--dry-run]

Arguments:
  suffix     The suffix to remove from filenames and class names (e.g., component, service, directive)
  all        Process all Angular file types in sequence (component, service, directive, pipe, guard, interceptor, resolver, module)
  --dry-run  Preview changes without modifying files

Examples:
  node tools/dist/rename-angular-files.js component
  node tools/dist/rename-angular-files.js service --dry-run
  node tools/dist/rename-angular-files.js all
  node tools/dist/rename-angular-files.js all --dry-run

This script will:
1. Find all files with the specified suffix (e.g., .component.ts, .component.html, etc.)
2. Rename them by removing the suffix (e.g., app.component.ts → app.ts)
3. Update class/function names by removing the suffix (e.g., App → App)
   Note: For class, enum, interface, pipe, module, guard, interceptor, and resolver files, only file names are renamed
4. Update all import statements, templateUrl, styleUrls, and other references
5. Handle TypeScript, HTML, CSS, SCSS, SASS, LESS, and spec files

When using 'all', the script processes file types in this order:
  component → service → directive → pipe → guard → interceptor → resolver → module
`);
    process.exit(0);
  }

  const suffix = args[0];
  const dryRun = args.includes('--dry-run');

  if (!suffix) {
    console.error('❌ Error: Please specify a suffix to remove or use "all"');
    process.exit(1);
  }

  if (suffix === 'all') {
    removeAllAngularSuffixes(dryRun).catch((error) => {
      console.error('❌ Fatal error:', (error as Error).message);
      process.exit(1);
    });
  } else {
    const renamer = new AngularFileSuffixRemover(suffix, dryRun);
    renamer.execute().catch((error) => {
      console.error('❌ Fatal error:', (error as Error).message);
      process.exit(1);
    });
  }
}

if (require.main === module) {
  main();
}

export default AngularFileSuffixRemover;
export { removeAllAngularSuffixes as renameAllAngularFiles };
