import fs from 'fs-extra-promise';
import ts from 'typescript';
import { dasherize } from '../../angular-cli/strings';
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

  const classAndDecoratorDeclaration = file.statements.find((node) =>
    isClassAndStartsWithStubWithDecorator(node, stub)
  );
  if (classAndDecoratorDeclaration) {
    const classDeclaration =
      classAndDecoratorDeclaration as ts.ClassDeclaration;
    definitionType = 'class';
    definitionName = classDeclaration.name?.escapedText ?? '';
    decoratorName = getDecoratorName(classDeclaration);
    return {
      definitionName,
      definitionType,
      decoratorName,
    };
  }

  const classDeclaration = file.statements.find((node) =>
    isClassAndStartsWithStub(node, stub)
  );
  if (classDeclaration) {
    const classNode = classDeclaration as ts.ClassDeclaration;
    definitionType = 'class';
    definitionName = classNode.name?.escapedText ?? '';
    return {
      definitionName,
      definitionType,
      decoratorName: '',
    };
  }

  const functionDeclaration = file.statements.find((node) =>
    isFunctionAndStartsWithStub(node, stub)
  );
  if (functionDeclaration) {
    const functionNode = functionDeclaration as ts.FunctionDeclaration;
    definitionType = 'function';
    definitionName = functionNode.name?.escapedText ?? '';
    return {
      definitionName,
      definitionType,
      decoratorName: '',
    };
  }

  const variableDeclaration = file.statements.find((node) =>
    isVariableAndStartsWithStub(node, stub)
  );
  if (variableDeclaration) {
    const variableNode = variableDeclaration as ts.VariableStatement;
    definitionType = 'variable';
    definitionName = getVariableName(variableNode);
    return {
      definitionName,
      definitionType,
      decoratorName: '',
    };
  }

  const interfaceDeclaration = file.statements.find((node) =>
    isInterfaceAndStartsWithStub(node, stub)
  );
  if (interfaceDeclaration) {
    const interfaceNode = interfaceDeclaration as ts.InterfaceDeclaration;
    definitionType = 'interface';
    definitionName = interfaceNode.name?.escapedText ?? '';
    return {
      definitionName,
      definitionType,
      decoratorName: '',
    };
  }

  const enumDeclaration = file.statements.find((node) =>
    isEnumAndStartsWithStub(node, stub)
  );
  if (enumDeclaration) {
    const enumNode = enumDeclaration as ts.EnumDeclaration;
    definitionType = 'enum';
    definitionName = enumNode.name?.escapedText ?? '';
    return {
      definitionName,
      definitionType,
      decoratorName: '',
    };
  }

  console.log('No definition found to rename in file');

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

function isClassAndStartsWithStubWithDecorator(
  node: ts.Statement,
  stub: string
): boolean {
  if (!isClassAndStartsWithStub(node, stub)) {
    return false;
  }
  const classDeclaration = node as ts.ClassDeclaration;
  const decoratorName = getDecoratorName(classDeclaration);
  return decoratorName.length > 0;
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
