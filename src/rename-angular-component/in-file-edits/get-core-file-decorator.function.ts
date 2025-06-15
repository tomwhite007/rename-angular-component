import fs from 'fs-extra-promise';
import ts from 'typescript';
import { classify, dasherize } from '../../angular-cli/strings';
import {
  CoreFileDefinitionDetails,
  DefinitionType,
} from '../definitions/file.interfaces';

export async function getCoreFileDefinitionDetails(
  filepath: string,
  stub: string
): Promise<CoreFileDefinitionDetails | null> {
  const sourceText = await fs.readFileAsync(filepath, 'utf-8');

  const file = ts.createSourceFile(
    filepath,
    sourceText,
    ts.ScriptTarget.Latest
  );

  let classOrFunction: DefinitionType = null;

  for (const node of file.statements) {
    if (ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node)) {
      classOrFunction = ts.isClassDeclaration(node) ? 'class' : 'function';
      const coreClassOrFunctionName = node.name?.escapedText ?? '';
      const decorator: any = node.modifiers?.find((decorator) => {
        if (ts.isDecorator(decorator)) {
          return true;
        }
        return false;
      });

      if (
        decorator &&
        ts.isDecorator(decorator) &&
        ts.isCallExpression(decorator.expression) &&
        ts.isIdentifier(decorator.expression.expression)
      ) {
        const decoratorName = decorator.expression.expression.text;
        if (classOrFunctionStartsWithStub(coreClassOrFunctionName, stub)) {
          return {
            definitionName: coreClassOrFunctionName.toString(),
            definitionType: classOrFunction,
            decoratorName,
          };
        }
      } else {
        return {
          definitionName: coreClassOrFunctionName.toString(),
          definitionType: classOrFunction,
          decoratorName: '',
        };
      }
    } else if (ts.isVariableStatement(node)) {
      const variable = node.declarationList.declarations[0];
      if (variable.name && ts.isIdentifier(variable.name)) {
        const variableName = variable.name.escapedText.toString();
        if (classOrFunctionStartsWithStub(variableName, stub)) {
          return {
            definitionName: variableName,
            definitionType: 'variable',
            decoratorName: '',
          };
        }
      }
    }
  }

  console.log(
    classOrFunction
      ? `${classify(classOrFunction)} Name found but no decorator.`
      : 'No Class or Function Name found.'
  );

  return null;
}

function classOrFunctionStartsWithStub(
  coreClassOrFunctionName: string,
  stub: string
): boolean {
  const dasherizedName = dasherize(coreClassOrFunctionName);
  const stubDashCount = stub.split('-').length;
  const nameDashCount = dasherizedName.split('-').length;
  return (
    dasherize(coreClassOrFunctionName).startsWith(stub) &&
    // allow one extra word for construct
    nameDashCount - stubDashCount < 2
  );
}
