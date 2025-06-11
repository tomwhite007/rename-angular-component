import fs from 'fs-extra-promise';
import ts from 'typescript';
import { classify } from '../../angular-cli/strings';
import { AngularConstruct } from '../definitions/file.interfaces';
import { getDecoratorName } from './get-decorator-name.function';

export async function getOriginalDefinitionName(
  stub: string,
  filepath: string,
  construct: AngularConstruct | undefined
) {
  const expectedOldClassName = `${classify(stub)}${classify(construct ?? '')}`;
  const sourceText = await fs.readFileAsync(filepath, 'utf-8');

  const file = ts.createSourceFile(
    filepath,
    sourceText,
    ts.ScriptTarget.Latest
  );

  const classNamesFound: string[] = [];
  const decoratorName = getDecoratorName(construct);

  for (const node of file.statements) {
    // get class
    if (ts.isClassDeclaration(node)) {
      if (
        node.name?.escapedText === expectedOldClassName // getClassNameEdits has been through here already
      ) {
        return expectedOldClassName;
      } else {
        // check decorator matches construct
        node.modifiers?.find((decorator) => {
          if (!ts.isDecorator(decorator)) {
            return false;
          }
          if (
            ts.isCallExpression(decorator.expression) &&
            ts.isIdentifier(decorator.expression.expression) &&
            decorator.expression.expression.text === decoratorName
          ) {
            classNamesFound.push(node.name?.escapedText ?? '');
          }
        });
      }
    }
  }

  switch (classNamesFound.length) {
    case 1:
      return classNamesFound[0];
    case 0:
      throw new Error(
        `Class Name and ${decoratorName} decorator not found in ${construct} file. Stopping.`
      );
    default:
      throw new Error(
        `Class Name not confirmed because there is more than one ${decoratorName} decorator found in ${construct} file. Stopping.`
      );
  }
}
