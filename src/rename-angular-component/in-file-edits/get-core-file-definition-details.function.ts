import fs from 'fs-extra-promise';
import ts from 'typescript';
import { dasherize } from '../../angular-cli/strings';
import {
  CoreFileDefinitionDetails,
  DefinitionType,
} from '../definitions/file.interfaces';

// Type guards for different TypeScript node types
const typeGuards = {
  isClassDeclaration: (node: ts.Statement): node is ts.ClassDeclaration =>
    ts.isClassDeclaration(node),

  isFunctionDeclaration: (node: ts.Statement): node is ts.FunctionDeclaration =>
    ts.isFunctionDeclaration(node),

  isVariableStatement: (node: ts.Statement): node is ts.VariableStatement =>
    ts.isVariableStatement(node),

  isInterfaceDeclaration: (
    node: ts.Statement
  ): node is ts.InterfaceDeclaration => ts.isInterfaceDeclaration(node),

  isEnumDeclaration: (node: ts.Statement): node is ts.EnumDeclaration =>
    ts.isEnumDeclaration(node),
};

// Helper functions for extracting names from nodes
const nameExtractors = {
  getClassName: (node: ts.ClassDeclaration): string =>
    node.name?.escapedText?.toString() ?? '',

  getFunctionName: (node: ts.FunctionDeclaration): string =>
    node.name?.escapedText?.toString() ?? '',

  getVariableName: (node: ts.VariableStatement): string => {
    if (node.declarationList.declarations.length > 0) {
      const variable = node.declarationList.declarations[0];
      if (ts.isIdentifier(variable.name)) {
        return variable.name.escapedText.toString();
      }
    }
    return '';
  },

  getInterfaceName: (node: ts.InterfaceDeclaration): string =>
    node.name?.escapedText?.toString() ?? '',

  getEnumName: (node: ts.EnumDeclaration): string =>
    node.name?.escapedText?.toString() ?? '',
};

// Definition processor interface
interface DefinitionProcessor {
  type: DefinitionType;
  predicate: (node: ts.Statement, stub: string) => boolean;
  extractName: (node: ts.Statement) => string;
  extractDecorator?: (node: ts.Statement) => string;
}

// Definition processors map
const definitionProcessors: DefinitionProcessor[] = [
  {
    type: 'class',
    predicate: (node: ts.Statement, stub: string) =>
      typeGuards.isClassDeclaration(node) &&
      hasDecorator(node) &&
      definitionStartsWithStub(nameExtractors.getClassName(node), stub),
    extractName: (node: ts.Statement) =>
      nameExtractors.getClassName(node as ts.ClassDeclaration),
    extractDecorator: (node: ts.Statement) =>
      getDecoratorName(node as ts.ClassDeclaration),
  },
  {
    type: 'class',
    predicate: (node: ts.Statement, stub: string) =>
      typeGuards.isClassDeclaration(node) &&
      !hasDecorator(node) &&
      definitionStartsWithStub(nameExtractors.getClassName(node), stub),
    extractName: (node: ts.Statement) =>
      nameExtractors.getClassName(node as ts.ClassDeclaration),
  },
  {
    type: 'function',
    predicate: (node: ts.Statement, stub: string) =>
      typeGuards.isFunctionDeclaration(node) &&
      definitionStartsWithStub(nameExtractors.getFunctionName(node), stub),
    extractName: (node: ts.Statement) =>
      nameExtractors.getFunctionName(node as ts.FunctionDeclaration),
  },
  {
    type: 'variable',
    predicate: (node: ts.Statement, stub: string) =>
      typeGuards.isVariableStatement(node) &&
      definitionStartsWithStub(nameExtractors.getVariableName(node), stub),
    extractName: (node: ts.Statement) =>
      nameExtractors.getVariableName(node as ts.VariableStatement),
  },
  {
    type: 'interface',
    predicate: (node: ts.Statement, stub: string) =>
      typeGuards.isInterfaceDeclaration(node) &&
      definitionStartsWithStub(nameExtractors.getInterfaceName(node), stub),
    extractName: (node: ts.Statement) =>
      nameExtractors.getInterfaceName(node as ts.InterfaceDeclaration),
  },
  {
    type: 'enum',
    predicate: (node: ts.Statement, stub: string) =>
      typeGuards.isEnumDeclaration(node) &&
      definitionStartsWithStub(nameExtractors.getEnumName(node), stub),
    extractName: (node: ts.Statement) =>
      nameExtractors.getEnumName(node as ts.EnumDeclaration),
  },
];

export async function getCoreFileDefinitionDetails(
  filepath: string,
  stub: string
): Promise<CoreFileDefinitionDetails | null> {
  try {
    const sourceText = await fs.readFileAsync(filepath, 'utf-8');
    const file = ts.createSourceFile(
      filepath,
      sourceText,
      ts.ScriptTarget.Latest
    );

    return findDefinitionInStatements(file.statements, stub);
  } catch (error) {
    console.error(`Error reading file ${filepath}:`, error);
    return null;
  }
}

function findDefinitionInStatements(
  statements: ts.NodeArray<ts.Statement>,
  stub: string
): CoreFileDefinitionDetails | null {
  for (const processor of definitionProcessors) {
    const matchingNode = statements.find((node) =>
      processor.predicate(node, stub)
    );

    if (matchingNode) {
      return {
        definitionName: processor.extractName(matchingNode),
        definitionType: processor.type,
        decoratorName: processor.extractDecorator?.(matchingNode) ?? '',
      };
    }
  }

  console.log('No definition found to rename in file');
  return null;
}

function hasDecorator(node: ts.ClassDeclaration): boolean {
  return getDecoratorName(node).length > 0;
}

function getDecoratorName(node: ts.ClassDeclaration): string {
  const decorator = node.modifiers
    ?.map((modifier) => isRenameableDecorator(modifier))
    .find((name) => !!name);

  return decorator ?? '';
}

function isRenameableDecorator(nodeModifier: ts.Node): string {
  const renameableDecorators = [
    'Component',
    'Directive',
    'Injectable',
    'Pipe',
    'NgModule',
    'Guard',
  ];
  if (
    nodeModifier &&
    ts.isDecorator(nodeModifier) &&
    ts.isCallExpression(nodeModifier.expression) &&
    ts.isIdentifier(nodeModifier.expression.expression) &&
    renameableDecorators.includes(nodeModifier.expression.expression.text)
  ) {
    return nodeModifier.expression.expression.text;
  }

  return '';
}

function definitionStartsWithStub(
  definitionName: string,
  stub: string
): boolean {
  if (stub.length === 0 || definitionName.length === 0) {
    return false;
  }

  const dasherizedName = dasherize(definitionName);
  const stubDashCount = stub.split('-').length;
  const nameDashCount = dasherizedName.split('-').length;

  return (
    dasherizedName.startsWith(stub) &&
    // allow one extra word for construct
    nameDashCount - stubDashCount < 2
  );
}
