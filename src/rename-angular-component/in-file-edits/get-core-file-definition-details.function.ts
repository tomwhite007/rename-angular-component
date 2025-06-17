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

  let definitionType: DefinitionType = null;

  for (const node of file.statements) {
    if (ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node)) {
      definitionType = ts.isClassDeclaration(node) ? 'class' : 'function';
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
        if (definitionStartsWithStub(coreClassOrFunctionName, stub)) {
          return {
            definitionName: coreClassOrFunctionName.toString(),
            definitionType,
            decoratorName,
          };
        }
      } else {
        return {
          definitionName: coreClassOrFunctionName.toString(),
          definitionType,
          decoratorName: '',
        };
      }
    } else if (ts.isVariableStatement(node)) {
      definitionType = 'variable';
      const variable = node.declarationList.declarations[0];
      if (variable.name && ts.isIdentifier(variable.name)) {
        const variableName = variable.name.escapedText.toString();
        if (definitionStartsWithStub(variableName, stub)) {
          return {
            definitionName: variableName,
            definitionType,
            decoratorName: '',
          };
        }
      }
    } else if (ts.isInterfaceDeclaration(node)) {
      definitionType = 'interface';
      const interfaceName = node.name.escapedText.toString();
      if (definitionStartsWithStub(interfaceName, stub)) {
        return {
          definitionName: interfaceName,
          definitionType,
          decoratorName: '',
        };
      }
    } else if (ts.isEnumDeclaration(node)) {
      definitionType = 'enum';
      const enumName = node.name.escapedText.toString();
      if (definitionStartsWithStub(enumName, stub)) {
        return {
          definitionName: enumName,
          definitionType,
          decoratorName: '',
        };
      }
    }
  }

  console.log(
    definitionType
      ? `${classify(definitionType)} Name found but no decorator.`
      : 'No Class or Function Name found.'
  );

  return null;
}

function definitionStartsWithStub(
  coreClassOrFunctionName: string,
  stub: string
): boolean {
  const dasherizedName = dasherize(coreClassOrFunctionName);
  const stubDashCount = stub.split('-').length;
  const nameDashCount = dasherizedName.split('-').length;
  return (
    dasherizedName.startsWith(stub) &&
    // allow one extra word for construct
    nameDashCount - stubDashCount < 2
  );
}
