// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { FileHandle } from 'fs/promises';
import * as vscode from 'vscode';
import { rename } from './helpers/rename.function';
import { ReferenceIndexer } from './indexer/referenceindexer';
import * as fs from 'fs-extra-promise';
import * as ts from 'typescript';
import { AngularConstruct } from './helpers/definitions/file.interfaces';

export function activate(context: vscode.ExtensionContext) {
  const importer: ReferenceIndexer = new ReferenceIndexer();

  const initWithProgress = () => {
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Window,
        title: 'Rename Angular Component is indexing',
      },
      async (progress) => {
        return importer.init(progress);
      }
    );
  };

  const initialise = () => {
    if (importer.isinitialised) {
      return Promise.resolve();
    }
    return initWithProgress();
  };

  const initialisePromise = initialise();

  let renameComponent = vscode.commands.registerCommand(
    'rename-angular-component.renameComponent',
    async (uri: vscode.Uri) =>
      // TODO: remove when no direct test process is needed
      // {
      //   const filePath =
      //     '/Users/tom/Development/dng/dgx-sales-spa-dev2/libs/sales/feature-appliance-details/src/lib/appliance-details/appliance-details.component.ts';

      //   const testText = await fs.readFileAsync(filePath, 'utf8');

      //   applyClassNameEdits(
      //     filePath,
      //     testText,
      //     'ApplianceDetailsComponent',
      //     'TestClass'
      //   );
      // }
      rename('component', uri, importer, initialisePromise)
  );
  context.subscriptions.push(renameComponent);

  let renameDirective = vscode.commands.registerCommand(
    'rename-angular-component.renameDirective',
    (uri: vscode.Uri) => rename('directive', uri, importer, initialisePromise)
  );
  context.subscriptions.push(renameDirective);

  let renameService = vscode.commands.registerCommand(
    'rename-angular-component.renameService',
    (uri: vscode.Uri) => rename('service', uri, importer, initialisePromise)
  );
  context.subscriptions.push(renameService);
}

export function deactivate() {}

interface FoundItem {
  itemType: 'class' | 'selector' | 'templateUrl' | 'styleUrls';
  itemText: string;
  location: { start: number; end: number };
}

type SelectorOrTemplateUrl = 'selector' | 'templateUrl';

interface GenericEdit {
  start: number;
  end: number;
  replacement: string;
}

function getCoreClassEdits(
  fileName: string,
  sourceText: string,
  originalClassName: string,
  newClassName: string,
  originalFileStub: string,
  newFileStub: string,
  construct: AngularConstruct
): GenericEdit[] {
  const foundItems = getCoreClassFoundItems(
    fileName,
    sourceText,
    originalClassName
  );

  return foundItems
    .map((foundItem) => {
      let replacement = '';
      switch (foundItem.itemType) {
        case 'class':
          replacement = newClassName;
          break;
        case 'selector':
        case 'templateUrl':
        case 'styleUrls':
          replacement = foundItem.itemText.replace(
            originalFileStub,
            newFileStub
          );
          // TODO: fix selector replacement for Directives
          break;
      }

      if (replacement === foundItem.itemText) {
        return null;
      }

      return {
        replacement,
        start: foundItem.location.start,
        end: foundItem.location.end,
      };
    })
    .filter((edit) => edit !== null) as GenericEdit[];
}

function getCoreClassFoundItems(
  fileName: string,
  sourceText: string,
  originalClassName: string
): FoundItem[] {
  const file = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest
  );

  const result: FoundItem[] = [];

  file.statements.forEach((node: ts.Node) => {
    // get class
    if (
      ts.isClassDeclaration(node) &&
      node.name?.escapedText === originalClassName
    ) {
      result.push({
        itemType: 'class',
        itemText: node.name?.escapedText,
        location: {
          start: node.name.pos,
          end: node.name.end,
        },
      });

      const decoratorPropertiesRequired = [
        'selector',
        'templateUrl',
        'styleUrls',
      ];

      // get decorator props for 'Component' decorator
      node.decorators?.find((decorator: ts.Decorator) => {
        if (
          ts.isCallExpression(decorator.expression) &&
          ts.isIdentifier(decorator.expression.expression) &&
          decorator.expression.expression.text === 'Component'
        ) {
          const test = decorator.expression.arguments[0];
          if (ts.isObjectLiteralExpression(test)) {
            test.properties.forEach((prop) => {
              if (
                ts.isPropertyAssignment(prop) &&
                ts.isIdentifier(prop.name) &&
                decoratorPropertiesRequired.includes(prop.name.text)
              ) {
                // 'selector' and 'templateUrl' are StringLiteral
                if (ts.isStringLiteral(prop.initializer)) {
                  result.push({
                    itemType: prop.name.text as SelectorOrTemplateUrl,
                    itemText: prop.initializer.text,
                    location: {
                      start: prop.initializer.pos,
                      end: prop.initializer.end,
                    },
                  });
                }

                // 'styleUrls' are an ArrayLiteralExpression
                if (
                  ts.isArrayLiteralExpression(prop.initializer) &&
                  prop.name.text === 'styleUrls'
                ) {
                  const specifier = prop.name.text;
                  prop.initializer.elements.forEach((elem) => {
                    if (ts.isStringLiteral(elem)) {
                      result.push({
                        itemType: specifier,
                        itemText: elem.text,
                        location: {
                          start: elem.pos,
                          end: elem.end,
                        },
                      });
                    }
                  });
                }
              }
            });
          }

          return true;
        }
      });
    }
  });

  return result;
}
