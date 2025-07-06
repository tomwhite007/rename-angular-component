import sinon from 'sinon';
import { workspace, WorkspaceConfiguration } from 'vscode';

export const stubGetConfiguration = (enabled: boolean) =>
  sinon.stub(workspace, 'getConfiguration').returns({
    get: (property: string) => {
      return enabled;
    },
  } as WorkspaceConfiguration);
