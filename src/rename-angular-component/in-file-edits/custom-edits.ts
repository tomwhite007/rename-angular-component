import ts from 'typescript';
import { camelize, classify } from '../../angular-cli/strings';
import {
  GenericEdit,
  GenericEditsCallback,
} from '../../move-ts-indexer/apply-generic-edits';
import {
  FoundItem,
  FoundItemType,
} from '../../move-ts-indexer/util/shared-interfaces';
import { escapeRegex } from '../../utils/escape-regex';
import { AngularConstruct } from '../definitions/file.interfaces';
import { generateNewSelector } from './generate-new-selector.function';
import { getSelectorType } from './get-selector-type.function';
import { stripSelectorBraces } from './strip-selector-braces.function';

type StringLiteralAttributesInScope = 'selector' | 'templateUrl' | 'styleUrl';

export class SelectorTransfer {
  oldSelector?: string;
  newSelector?: string;
}

export function getCoreClassEdits(
  originalClassName: string,
  newClassName: string,
  originalFileStub: string,
  newFileStub: string,
  newFilenameInput: string,
  construct: AngularConstruct,
  selectorTransfer: SelectorTransfer,
  debugLogToFile?: (...args: string[]) => void
): GenericEditsCallback {
  return (fileName: string, sourceText: string) => {
    const foundItems = getCoreClassFoundItems(
      fileName,
      sourceText,
      originalClassName,
      newClassName,
      construct
    );

    if (debugLogToFile) {
      debugLogToFile('getCoreClassFoundItems:', JSON.stringify(foundItems), '');
    }

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
              foundItem.itemText,
              originalFileStub,
              newFileStub
            );
            replacement = `'${selectorTransfer.newSelector}'`;
            break;
          case 'name':
            if (construct === 'pipe') {
              selectorTransfer.oldSelector = foundItem.itemText;
              selectorTransfer.newSelector = camelize(newFileStub);
              replacement = `'${selectorTransfer.newSelector}'`;
            }
            break;
          case 'templateUrl':
          case 'styleUrl':
          case 'styleUrls':
            replacement = `'${foundItem.itemText.replace(
              new RegExp(
                `(?<=\\/|^)${escapeRegex(
                  originalFileStub
                )}(\\.${construct})?(?=\\.(html|scss|css|sass|less)$)`
              ),
              newFilenameInput
            )}'`;
            break;
          case 'attributeInput':
            if (selectorTransfer.newSelector) {
              replacement = stripSelectorBraces(selectorTransfer.newSelector);
            } else {
              const msg =
                'selectorTransfer.newSelector undefined for attributeInput!';
              console.error(msg);
              if (debugLogToFile) {
                debugLogToFile(msg);
              }
            }
            break;
        }

        if (replacement === foundItem.itemText || !replacement) {
          return null;
        }

        if (debugLogToFile) {
          debugLogToFile('replacement: ' + replacement);
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
  originalClassName: string,
  newClassName: string,
  construct: AngularConstruct
): FoundItem[] {
  const file = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest
  );

  const result: FoundItem[] = [];
  const recurseThroughNodeTree = (() =>
    getTreeRecursor(originalClassName, sourceText, result))();

  let classNameChangedAlready = false;

  file.statements.forEach((node: ts.Node) => {
    // get class
    if (ts.isClassDeclaration(node)) {
      if (
        node.name?.escapedText === newClassName // getClassNameEdits has been through here already
      ) {
        classNameChangedAlready = true;
      }

      let selector = '';

      if (
        node.name?.escapedText === originalClassName ||
        classNameChangedAlready
      ) {
        const decoratorPropertiesRequired: FoundItem['itemType'][] = [
          'selector',
          'templateUrl',
          'styleUrl',
          'styleUrls',
          'name',
        ];

        const decoratorName = classify(construct);

        // get decorator props for decoratorName
        node.modifiers?.find((decorator) => {
          if (!ts.isDecorator(decorator)) {
            return false;
          }
          if (
            ts.isCallExpression(decorator.expression) &&
            ts.isIdentifier(decorator.expression.expression) &&
            decorator.expression.expression.text === decoratorName
          ) {
            const arg = decorator.expression.arguments[0];
            if (ts.isObjectLiteralExpression(arg)) {
              arg.properties.forEach((prop) => {
                if (
                  ts.isPropertyAssignment(prop) &&
                  ts.isIdentifier(prop.name) &&
                  decoratorPropertiesRequired.includes(
                    prop.name.text as FoundItemType
                  )
                ) {
                  // 'selector', 'templateUrl' and 'styleUrl' are StringLiteral
                  if (ts.isStringLiteral(prop.initializer)) {
                    result.push({
                      itemType: prop.name
                        .text as StringLiteralAttributesInScope,
                      itemText: prop.initializer.text,
                      location: {
                        start: prop.initializer.pos + 1,
                        end: prop.initializer.end,
                      },
                    });
                    if (prop.name.text === 'selector') {
                      selector = prop.initializer.text;
                    }
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

      // Rename Input if same name as selector
      if (
        getSelectorType(selector) === 'attribute' &&
        ts.isClassDeclaration(node)
      ) {
        let renameClassProperty = false;

        ts.forEachChild(node, (childNode) => {
          if (ts.isPropertyDeclaration(childNode)) {
            // Input property name is different to template property
            childNode.modifiers?.find((dec) => {
              if (!ts.isDecorator(dec)) {
                return false;
              }
              if (
                ts.isCallExpression(dec.expression) &&
                ts.isIdentifier(dec.expression.expression) &&
                dec.expression.expression.escapedText === 'Input'
              ) {
                const identifier = dec.expression.arguments[0];
                if (
                  identifier &&
                  ts.isStringLiteral(identifier) &&
                  identifier.text === stripSelectorBraces(selector)
                ) {
                  result.push({
                    itemType: 'attributeInput',
                    itemText: identifier.text,
                    location: {
                      start: identifier.pos + 1,
                      end: identifier.end - 1,
                    },
                  });
                  return true;
                }
              }
            });

            if (ts.isIdentifier(childNode.name)) {
              const identifier = childNode.name;
              // Input property name is same as template property
              if (
                identifier.escapedText === stripSelectorBraces(selector, true)
              ) {
                result.push({
                  itemType: 'attributeInput',
                  itemText: identifier.escapedText,
                  location: {
                    start: identifier.pos + 1,
                    end: identifier.end,
                  },
                });

                renameClassProperty = true;
                return true;
              }
            }
          }
        });

        if (renameClassProperty) {
          // loop again to find Property Access Expressions

          const propertyAccessRecursor = (node: ts.Node) => {
            if (
              ts.isPropertyAccessExpression(node) &&
              node.expression.kind === ts.SyntaxKind.ThisKeyword &&
              ts.isIdentifier(node.name) &&
              node.name.escapedText === stripSelectorBraces(selector, true)
            ) {
              result.push({
                itemType: 'attributeInput',
                itemText: node.name.escapedText,
                location: {
                  start: node.name.pos,
                  end: node.name.end,
                },
              });
            } else {
              ts.forEachChild(node, propertyAccessRecursor);
            }
          };

          ts.forEachChild(node, (childNode) => {
            propertyAccessRecursor(childNode);
          });
        }
      }
    }

    if (!classNameChangedAlready) {
      recurseThroughNodeTree(node);
    }
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
    const isTestFile = Boolean(fileName.match(/\.spec\.ts$/));

    const result: FoundItem[] = [];
    const recurseThroughNodeTree = (() =>
      getTreeRecursor(className, sourceText, result, isTestFile))();

    file.statements.forEach((node: ts.Node) => {
      if (ts.isExpressionStatement(node)) {
        node.expression.forEachChild((arg) => {
          if (ts.isStringLiteral(arg)) {
            const argIndex = arg.text.search(
              new RegExp(`(?<!\\w)${escapeRegex(className)}(?!\\w)`)
            );

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
    console.error('ERROR PROCESSING: ', fileName, e);
  }
}

function getTreeRecursor(
  className: string,
  sourceText: string,
  result: FoundItem[],
  replaceStringClassNames?: boolean
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
      if (replaceStringClassNames && ts.isExpression(node)) {
        node.forEachChild((expressionProp) => {
          if (
            ts.isStringLiteral(expressionProp) &&
            expressionProp.text === className
          ) {
            const realString = sourceText.substring(
              expressionProp.pos,
              expressionProp.end
            );
            const shim = realString.indexOf(className);
            const start = expressionProp.pos + shim;

            if (!result.find((item) => item.location.start === start)) {
              result.push({
                itemType: 'class',
                itemText: className,
                location: {
                  start,
                  end: start + className.length, // inside quotes
                },
              });
            }
          }
        });
      }

      ts.forEachChild(node, recurseThroughNodeTree);
    }
  };
  return recurseThroughNodeTree;
}
