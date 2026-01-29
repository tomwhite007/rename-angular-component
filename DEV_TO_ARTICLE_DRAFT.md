# Renaming Angular Suffixes in 2026: A Pragmatic Guide for "Legacy" Projects

_By Tom White_

I know, I know. We're already on Angular v21. If you're starting a greenfield project today, you're probably already using the latest style guide conventions without a second thought. But let's be real: plenty of us are maintaining codebases that are at least a year old - ancient history in Angular Renaissance time.

If you're working on one of these "legacy" projects (and by legacy, I mean anything created before breakfast yesterday), you might be looking at the [Angular style guide's suggestion to drop the `.component`, `.service`, and `.directive` suffixes](https://angular.dev/style-guide) and thinking, "That looks clean, but I have 500+ components. So, no thanks."

I felt the same way. The Angular CLI gives us great scaffolding, but now the long-standing convention has changed, we're left with a mountain of technical debt. Renaming files manually is tedious, error-prone, and let's be honest, boring.

So, I updated my VS Code extension, [Rename Angular Component](https://marketplace.visualstudio.com/items?itemName=tomwhite007.rename-angular-component), with a feature called **"Rename all Angular suffixes to v20 styleguide"**.

But there's a catch.

## 💥 The Namespace Collision Problem

When you strip suffixes, you quickly run into a problem I call "Namespace Collision."

Imagine you have:

- `user.component.ts` (Class: `UserComponent`)
- `user.service.ts` (Class: `UserService`)
- `user.interface.ts` (Interface: `User`)

If you blindly run a script to remove "Component" and "Service" suffixes, you end up with:

- `user.ts` (Class: `User`)
- `user.ts` (Class: `User`)
- `user.ts` (Interface: `User`)

Three classes named `User` in three files named `user.ts`. The compiler screams, the linter faints, and you reach for `git reset --hard`.

I wanted to find the best way to handle this, so I took the [Angular Realworld Example App](https://github.com/realworld-apps/angular-realworld-example-app) for a spin to test two different approaches using the extension.

**⚠️ Note:** Whichever path you choose, **do not commit** your changes immediately after running the bulk rename command. You need the file changes to sit in your working tree so that `git diff` is available. This diff is the evidence that either you (in Path 1) or the AI agent (in Path 2) will use to identify what happened and spot the collisions.

## 🛠️ Approach 1: The Deterministic (Manual) Way

This is for those who trust their own hands more than a probabilistic model.

1.  **Run the "Rename all Angualr file types" option.**
    You'll immediately see the collisions. Git is your friend here. Note down the offenders (e.g., `profile.component`, `profile.service`, `user.component`, `user.service`, `article.component`).
2.  **Revert and Retry.**
    Reset your changes. Run the command again, but this time, enter the colliding distinct names into the **exclusions list**.

    The tool will rename your app—classes, filenames, selectors, and imports - leaving just the tricky ones untouched.

3.  **Finish with the Scalpel.**
    Now, use the extension's main feature: **Rename Angular Component**. usage is simple: right-click a file, type the new name.

    For the collisions, you can make semantic decisions. Rename `UserService` to `UserDataAccess` or `UserAuth`. The extension handles the heavy lifting of updating every reference, import, and template selector in less than a second.

    It’s fast. It’s cleaner. And frankly, for a handful of files, it's quicker than explaining the context to an LLM.

## 🤖 Approach 2: The "AI Assisted" Way

If scale is your problem (or you're just tired), the extension now comes with a specifically crafted **AI Agent Prompt**.

1.  **Run the "Rename all Angular file types" option.**
    Let the collisions happen. Let the build break.
2.  **Summon the Agent.**
    Copy the [provided prompt](https://github.com/tomwhite007/rename-angular-component/blob/main/src/rename-angular-component/suffix-removal/README.md#ai-agent-prompt) (it's built into the extension documentation, and pops up when you run the command).

    The prompt basically tells your AI agent (Cursor, Windsurf, or whatever you're using):

    > "I just broke my build by renaming everything to `User`. Please look at the usage. If it has HTTP calls, rename it `UserDataAccess`. If it has Observables, rename it `UserState`. Fix the imports."

3.  **Review the Magic.**
    The AI will typically parse your code, understand that `UserService` was actually handling API calls, and rename it to `UserDataAccess` automatically.

    And, then it gives you a simple exportable summary of the changes it made.

I tried this on the [Angular Realworld Example App](https://github.com/realworld-apps/angular-realworld-example-app). It correctly identified that `UserService` and `UserComponent` were colliding, and renamed the service to `UserDataAccess` (because it saw the HTTP client usage), resolving the conflict without me typing a single character. I've submited the output as a PR on their [GitHub repo](https://github.com/realworld-apps/angular-realworld-example-app/pull/1).

## 🤔 Why Not Just Use AI for Everything?

You might ask, "Why do I need an extension? I'll just ask ChatGPT to rename my project."

Have you tried asking an LLM to rename 500 files, update their imports, fix the usage in templates, and ensure the selectors match the new file structure? It will take quite a few iterations, and on a large project, disappear your month's tokens.

Specialized tools like **Rename Angular Component** are deterministic. They follow the AST. They don't guess. They burn significantly fewer trees (and GPU cycles) than spinning up a massive model just to rename a string.

Use AI for the hard stuff—deciding _what_ to name a colliding service. Use the extension for the grunt work—renaming the other 498 files correctly.

## 🏁 Conclusion

If you're updating your "legacy" Angular project to modern standards:

1.  Embrace the Angular v21 styleguide.
2.  Use tools that respect your time.
3.  Check out **Rename Angular Component** on the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=tomwhite007.rename-angular-component), or the [Open VSIX Registry](https://open-vsx.org/extension/tomwhite007/rename-angular-component) if you use Cursor or Antigravity.

Happy renaming!
