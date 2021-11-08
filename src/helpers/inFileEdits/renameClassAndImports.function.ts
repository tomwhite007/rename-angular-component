import * as replace from "replace-in-file";
import escapeStringRegexp from "escape-string-regexp";

export function renameClassAndImports(
  projectRoot: string,
  originalClassName: string,
  newClassName: string,
  oldLocalFilePath: string,
  newLocalFilePath: string
) {
  const oriClassRegex = new RegExp(
    `(?<![A-Za-z]+)${originalClassName}(?![A-Za-z]+)`,
    "g"
  );
  const oriImportRegex = new RegExp(
    `import[\\s\\n]+\\{[\\s\\n]+[a-z,\\s]+[\\s\\n]+\\}[\\s\\n]+from[\\s\\n]+['"]{1}[^'"\\n]+${escapeStringRegexp(
      oldLocalFilePath
    )}['"]{1}`,
    "gi"
  );

  const options = {
    files: `${projectRoot}/**/*.ts`,
    ignore: `${projectRoot}/node_modules/*`,
    from: [oriClassRegex, oriImportRegex],
    to: [
      newClassName,
      (match: string) => match.replace(oldLocalFilePath, newLocalFilePath),
    ],
  };

  let renameClasssuccessMsg = "";
  let renameClassErrorMsgs: string[] = [];

  try {
    const results = replace.replaceInFileSync(options);
    renameClasssuccessMsg = `Renamed Class in ${
      results.filter((res) => res.hasChanged).length
    } files.`;
  } catch (error) {
    renameClassErrorMsgs = ["Error when renaming Class in files"];
  }

  return { renameClasssuccessMsg, renameClassErrorMsgs };
}
