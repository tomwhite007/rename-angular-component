# Change Log

## [Unreleased]

- started 2021-07-23

## [1.0.0] - 2021-12-27

- Initial release
  MVP (needs extensive cleanup refactor)

## [1.0.1] - 2021-12-29

- Bug fix: Discover original Class Name rather than predict it

## [1.0.2] - 2022-01-04

- Feature: Add optional debug log to file for issue creation
- Refactor: Migrate Renamer code into class

## [1.0.3] - 2022-01-07

- Bug fix: SCSS file './' type @imports affected by move process
- Bug fix: multi level inheritance in tsconfigs to pick up paths and baseUrl

## [1.0.4] - 2022-01-13

- Refactor: Use Angular CLI's own validation and string-case manipulation functions for Component name

## [1.0.5] - 2022-01-17

- Feature: Improved feedback for unexpected selector

## [1.0.6] - 2022-02-03

- Feature: Add support for direct, local path replacements when longer wildcard path is available.
- Feature: Add support for rename Route Guards

## [1.0.7] - 2022-02-03

- Fix: Local Windows file path should be Unix format

## [1.1.0] - 2022-02-21

- Feature: add compatibility with Nx Workspaces and projects that use layers of wildcard export barrels
- Fix: edge case race condition on imports changed in component and spec file
- Fix: edge case replacement of selectors missed in some templates due to line break in end tag
- Fix: replace dots with dashes for name
