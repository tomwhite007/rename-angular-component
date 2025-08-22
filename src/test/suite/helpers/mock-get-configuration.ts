import sinon from 'sinon';
import { workspace, WorkspaceConfiguration } from 'vscode';

interface ConfigItems {
  followAngular20FolderAndSelectorNamingConvention?: boolean;
  projectUsesStandaloneComponentsOnly?: boolean;
  useLocalDirectPaths?: boolean;
  openEditors?: boolean;
  debugLog?: boolean;
}

const defaultConfig: ConfigItems = {
  followAngular20FolderAndSelectorNamingConvention: true,
  projectUsesStandaloneComponentsOnly: true,
  useLocalDirectPaths: true,
  openEditors: false,
  debugLog: false,
};

export const stubGetConfiguration = (configItems: ConfigItems) =>
  sinon.stub(workspace, 'getConfiguration').returns({
    get: (property: string) => {
      const returnValue =
        configItems[property as keyof ConfigItems] ??
        defaultConfig[property as keyof ConfigItems] ??
        false;
      console.log(`getConfiguration: ${property} = ${returnValue}`);
      return returnValue;
    },
  } as WorkspaceConfiguration);
