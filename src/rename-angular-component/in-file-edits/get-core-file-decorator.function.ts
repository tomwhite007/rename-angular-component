import fs from 'fs-extra-promise';
import ts from 'typescript';
import { dasherize } from '../../angular-cli/strings';

export async function getCoreFileDecorator(
  filepath: string,
  stub: string
): Promise<string> {
  const sourceText = await fs.readFileAsync(filepath, 'utf-8');

  const file = ts.createSourceFile(
    filepath,
    sourceText,
    ts.ScriptTarget.Latest
  );

  let classOrFunction = '';

  for (const node of file.statements) {
    if (ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node)) {
      classOrFunction = ts.isClassDeclaration(node) ? 'Class' : 'Function';
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
          return decoratorName;
        }
      }
    }
  }

  // console.log('sourceText', sourceText);
  throw new Error(
    classOrFunction
      ? `${classOrFunction} Name found but no decorator. Stopping.`
      : 'No Class or Function Name found. Stopping.'
  );
}

function classOrFunctionStartsWithStub(
  coreClassOrFunctionName: string,
  stub: string
): boolean {
  return dasherize(coreClassOrFunctionName).startsWith(stub);
}
