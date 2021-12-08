import * as ts from 'typescript';
import { AngularConstruct } from '../helpers/definitions/file.interfaces';
import { generateNewSelector } from '../helpers/inFileEdits/generateNewSelector.funtion';

interface FoundItem {
  itemType: 'class' | 'selector' | 'templateUrl' | 'styleUrls';
  itemText: string;
  location: { start: number; end: number };
}

type SelectorOrTemplateUrl = 'selector' | 'templateUrl';

export interface GenericEdit {
  start: number;
  end: number;
  replacement: string;
}

export type GenericEditsCallback = (
  filePath: string,
  text: string
) => GenericEdit[];

export function applyGenericEdits(text: string, edits: GenericEdit[]): string {
  const replaceBetween = (
    str: string,
    start: number,
    end: number,
    replacement: string
  ): string => {
    return str.substr(0, start) + replacement + str.substr(end);
  };

  edits.sort((a, b) => {
    return a.start - b.start;
  });

  let editOffset = 0;
  for (let i = 0; i < edits.length; i++) {
    const edit = edits[i];
    text = replaceBetween(
      text,
      edit.start + editOffset,
      edit.end + editOffset,
      edit.replacement
    );
    editOffset += edit.replacement.length - (edit.end - edit.start);
  }
  return text;
}

export class SelectorTransfer {
  oldSelector?: string;
  newSelector?: string;
}

export function getCoreClassEdits(
  originalClassName: string,
  newClassName: string,
  originalFileStub: string,
  newFileStub: string,
  construct: AngularConstruct,
  selectorTransfer: SelectorTransfer
): GenericEditsCallback {
  return (fileName: string, sourceText: string) => {
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
            selectorTransfer.oldSelector = foundItem.itemText;
            selectorTransfer.newSelector = generateNewSelector(
              construct,
              foundItem.itemText,
              originalFileStub,
              newFileStub
            );
            replacement = `'${selectorTransfer.newSelector}'`;
            // TODO: fix selector replacement for Directives [] .[a-z] etc.
            break;
          case 'templateUrl':
          case 'styleUrls':
            replacement = `'${foundItem.itemText.replace(
              originalFileStub,
              newFileStub
            )}'`;
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
  };
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
  const recurseThroughNodeTree = (() =>
    getTreeRecursor(originalClassName, sourceText, result))();

  file.statements.forEach((node: ts.Node) => {
    // get class
    if (
      ts.isClassDeclaration(node) &&
      node.name?.escapedText === originalClassName
    ) {
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
                      start: prop.initializer.pos + 1,
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

    recurseThroughNodeTree(node);
  });

  return result;
}

export function getClassNameEdits(
  originalClassName: string,
  newClassName: string
): GenericEditsCallback {
  return (fileName: string, sourceText: string) => {
    const foundItems = getClassNameFoundItems(
      fileName,
      sourceText,
      originalClassName
    );

    return foundItems
      ?.map((foundItem) => {
        if (foundItem.itemType === 'class') {
          return {
            replacement: newClassName,
            start: foundItem.location.start,
            end: foundItem.location.end,
          };
        }
        return null;
      })
      .filter((edit) => edit !== null) as GenericEdit[];
  };
}

function getClassNameFoundItems(
  fileName: string,
  sourceText: string,
  className: string
) {
  try {
    const file = ts.createSourceFile(
      fileName,
      sourceText,
      ts.ScriptTarget.Latest
    );

    const result: FoundItem[] = [];
    const recurseThroughNodeTree = (() =>
      getTreeRecursor(className, sourceText, result))();

    file.statements.forEach((node: ts.Node) => {
      if (ts.isExpressionStatement(node)) {
        node.expression.forEachChild((arg) => {
          if (ts.isStringLiteral(arg)) {
            const argIndex = arg.text.indexOf(className);
            if (argIndex >= 0) {
              result.push({
                itemType: 'class',
                itemText: className,
                location: {
                  start: arg.pos + argIndex + 1,
                  end: arg.pos + argIndex + className.length + 1,
                },
              });
            }
          }
        });
      }

      recurseThroughNodeTree(node);
    });

    return result;
  } catch (e) {
    console.log('ERROR PROCESSING: ', fileName, e);
  }
}

function getTreeRecursor(
  className: string,
  sourceText: string,
  result: FoundItem[]
) {
  const recurseThroughNodeTree = (node: ts.Node) => {
    if (ts.isIdentifier(node)) {
      if (node.text === className) {
        const realString = sourceText.substring(node.pos, node.end);
        const shim = realString.indexOf(className);

        result.push({
          itemType: 'class',
          itemText: className,
          location: {
            start: node.pos + shim,
            end: node.end,
          },
        });
      }
    } else {
      ts.forEachChild(node, recurseThroughNodeTree);
    }
  };
  return recurseThroughNodeTree;
}
