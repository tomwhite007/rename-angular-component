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

  let definitionName = '';
  let definitionType: DefinitionType = null;
  let decoratorName = '';

  for (const node of file.statements) {
    if (isClassAndStartsWithStub(node, stub)) {
      const classDeclaration = node as ts.ClassDeclaration;
      definitionType = 'class';
      definitionName = classDeclaration.name?.escapedText ?? '';
      decoratorName = getDecoratorName(classDeclaration);
    } else if (isFunctionAndStartsWithStub(node, stub)) {
      const functionDeclaration = node as ts.FunctionDeclaration;
      definitionType = 'function';
      definitionName = functionDeclaration.name?.escapedText ?? '';
    } else if (isVariableAndStartsWithStub(node, stub)) {
      const variableDeclaration = node as ts.VariableStatement;
      definitionType = 'variable';
      definitionName = getVariableName(variableDeclaration);
    } else if (isInterfaceAndStartsWithStub(node, stub)) {
      const interfaceDeclaration = node as ts.InterfaceDeclaration;
      definitionType = 'interface';
      definitionName = interfaceDeclaration.name?.escapedText ?? '';
    } else if (isEnumAndStartsWithStub(node, stub)) {
      const enumDeclaration = node as ts.EnumDeclaration;
      definitionType = 'enum';
      definitionName = enumDeclaration.name?.escapedText ?? '';
    }
    if (definitionName) {
      return {
        definitionName,
        definitionType,
        decoratorName,
      };
    }
  }

  console.log(
    definitionType
      ? `${classify(definitionType)} Name found but no decorator.`
      : 'No Class or Function Name found.'
  );

  return null;
}

function getDecoratorName(node: ts.ClassDeclaration): string {
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
    return decorator.expression.expression.text;
  }
  return '';
}

function isClassAndStartsWithStub(node: ts.Statement, stub: string): boolean {
  const isClass = ts.isClassDeclaration(node);
  if (!isClass) {
    return false;
  }
  const className = isClass ? node.name?.escapedText.toString() ?? '' : '';
  return definitionStartsWithStub(className, stub);
}

function isFunctionAndStartsWithStub(
  node: ts.Statement,
  stub: string
): boolean {
  const isFunction = ts.isFunctionDeclaration(node);
  if (!isFunction) {
    return false;
  }
  const functionName = isFunction
    ? node.name?.escapedText.toString() ?? ''
    : '';
  return definitionStartsWithStub(functionName, stub);
}

function isVariableAndStartsWithStub(
  node: ts.Statement,
  stub: string
): boolean {
  if (ts.isVariableStatement(node)) {
    const variableName = getVariableName(node);
    if (definitionStartsWithStub(variableName, stub)) {
      return true;
    }
  }
  return false;
}

function isInterfaceAndStartsWithStub(
  node: ts.Statement,
  stub: string
): boolean {
  const isInterface = ts.isInterfaceDeclaration(node);
  if (!isInterface) {
    return false;
  }
  const interfaceName = isInterface
    ? node.name?.escapedText.toString() ?? ''
    : '';
  return definitionStartsWithStub(interfaceName, stub);
}

function isEnumAndStartsWithStub(node: ts.Statement, stub: string): boolean {
  const isEnum = ts.isEnumDeclaration(node);
  if (!isEnum) {
    return false;
  }
  const enumName = isEnum ? node.name?.escapedText.toString() ?? '' : '';
  return definitionStartsWithStub(enumName, stub);
}

function getVariableName(node: ts.VariableStatement): string {
  if (node.declarationList.declarations.length > 0) {
    const variable = node.declarationList.declarations[0];
    if (ts.isIdentifier(variable.name)) {
      return variable.name.escapedText.toString();
    }
  }
  return '';
}

function definitionStartsWithStub(
  coreClassOrFunctionName: string,
  stub: string
): boolean {
  if (stub.length === 0) {
    return false;
  }
  const dasherizedName = dasherize(coreClassOrFunctionName);
  const stubDashCount = stub.split('-').length;
  const nameDashCount = dasherizedName.split('-').length;
  return (
    dasherizedName.startsWith(stub) &&
    // allow one extra word for construct
    nameDashCount - stubDashCount < 2
  );
}
