import * as replace from "replace-in-file";
import { AngularConstruct } from "../definitions/file.interfaces";
import escapeStringRegexp from "escape-string-regexp";

export function renameSelector(
  construct: AngularConstruct,
  projectRoot: string,
  originalSelector: string,
  newSelector: string
) {
  let renameSelectorSuccessMsg = "";
  let renameSelectorErrorMsgs: string[] = [];
  if (!originalSelector || !newSelector) {
    return { renameSelectorSuccessMsg, renameSelectorErrorMsgs };
  }

  let oriSelectorRegex: RegExp;

  switch (construct) {
    case "component":
      oriSelectorRegex = new RegExp(
        `(?<=<|<\\/)${originalSelector}(?=\\n|\\s|>)`,
        "g"
      );
      break;
    case "directive":
      originalSelector = originalSelector.replace(/\[|\]/g, "");
      newSelector = newSelector.replace(/\[|\]/g, "");
      oriSelectorRegex = new RegExp(
        `(?<=\\s)${originalSelector}(?=\\s|\\=|>)`,
        "g"
      );
      break;
    default:
      return { renameSelectorSuccessMsg, renameSelectorErrorMsgs };
  }

  const options = {
    files: `${projectRoot}/**/*.html`,
    ignore: `${projectRoot}/node_modules/**/*`,
    from: oriSelectorRegex,
    to: newSelector,
  };

  try {
    const results = replace.replaceInFileSync(options);
    renameSelectorSuccessMsg = `Renamed selector in ${
      results.filter((res) => res.hasChanged).length
    } files.`;
  } catch (error) {
    renameSelectorErrorMsgs = ["Error when renaming Class in files"];
  }

  return { renameSelectorSuccessMsg, renameSelectorErrorMsgs };
}
