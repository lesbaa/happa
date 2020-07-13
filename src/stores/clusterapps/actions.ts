import { createAppConfig } from 'actions/appConfigActions';
import { createAppSecret } from 'actions/appSecretActions';
import GiantSwarm, { V4App } from 'giantswarm';
import { FlashMessage, messageTTL, messageType } from 'lib/flashMessage';
import { IState } from 'reducers/types';
import { StatusCodes } from 'shared/constants';
import { v4orV5 } from 'utils/v4orV5';

import { createAsynchronousAction } from '../asynchronousAction';

interface IUpdateClusterAppRequest {
  appName: string;
  clusterId: string;
  version: string;
}

interface IUpdateClusterAppResponse {
  error: string;
}

export const updateClusterApp = createAsynchronousAction<
  IUpdateClusterAppRequest,
  IState,
  IUpdateClusterAppResponse
>({
  actionTypePrefix: 'UPDATE_CLUSTER_APP',
  perform: async (state, _dispatch, payload) => {
    if (!payload) {
      throw new TypeError('request payload cannot be undefined');
    }

    const { appName, clusterId, version } = payload;

    const appsApi = new GiantSwarm.AppsApi();

    const modifyApp = v4orV5(
      appsApi.modifyClusterAppV4.bind(appsApi),
      appsApi.modifyClusterAppV5.bind(appsApi),
      clusterId,
      state
    );

    try {
      await modifyApp(clusterId, appName, { body: { spec: version } });

      new FlashMessage(
        `App <code>${appName}</code> on <code>${clusterId}</code> has been updated. Changes might take some time to take effect.`,
        messageType.SUCCESS,
        messageTTL.LONG
      );

      return {
        error: '',
      };
    } catch (error) {
      const errorMessage =
        error?.message ||
        'Something went wrong while trying to update your app. Please try again later or contact support.';

      throw new Error(errorMessage);
    }
  },
  shouldPerform: () => true,
  throwOnError: false,
});

interface IDeleteClusterAppRequest {
  appName: string;
  clusterId: string;
}

interface IDeleteClusterAppResponse {
  appName: string;
  clusterId: string;
}

export const deleteClusterApp = createAsynchronousAction<
  IDeleteClusterAppRequest,
  IState,
  IDeleteClusterAppResponse
>({
  actionTypePrefix: 'DELETE_CLUSTER_APP',
  perform: async (state, _dispatch, payload) => {
    if (!payload) {
      throw new TypeError('request payload cannot be undefined');
    }

    const { appName, clusterId } = payload;

    const appsApi = new GiantSwarm.AppsApi();

    const deleteApp = v4orV5(
      appsApi.deleteClusterAppV4.bind(appsApi),
      appsApi.deleteClusterAppV5.bind(appsApi),
      clusterId,
      state
    );

    try {
      await deleteApp(clusterId, appName);

      new FlashMessage(
        `App <code>${appName}</code> was scheduled for deletion on <code>${clusterId}</code>. This may take a couple of minutes.`,
        messageType.SUCCESS,
        messageTTL.LONG
      );

      return { appName, clusterId };
    } catch (error) {
      new FlashMessage(
        `Something went wrong while trying to delete your app. Please try again later or contact support: support@giantswarm.io`,
        messageType.ERROR,
        messageTTL.LONG
      );

      throw error;
    }
  },
  shouldPerform: () => true,
  throwOnError: false,
});

interface ILoadClusterAppsRequest {
  clusterId: string;
}

interface ILoadClusterAppsResponse {
  apps: V4App[];
  clusterId: string;
}

export const loadClusterApps = createAsynchronousAction<
  ILoadClusterAppsRequest,
  IState,
  ILoadClusterAppsResponse
>({
  actionTypePrefix: 'LOAD_CLUSTER_APPS',

  perform: async (state, _dispatch, payload) => {
    if (!payload || !payload.clusterId) {
      throw new TypeError(
        'request payload cannot be undefined and must contain a clusterId'
      );
    }

    const appsApi = new GiantSwarm.AppsApi();

    const getClusterApps = v4orV5(
      appsApi.getClusterAppsV4.bind(appsApi),
      appsApi.getClusterAppsV5.bind(appsApi),
      payload.clusterId,
      state
    );

    try {
      let apps = await getClusterApps(payload.clusterId);
      apps = Array.from(apps);

      return {
        apps: apps,
        clusterId: payload.clusterId,
      };
    } catch (error) {
      new FlashMessage(
        'Something went wrong while trying to load apps installed on this cluster.',
        messageType.ERROR,
        messageTTL.LONG,
        'Please try again later or contact support: support@giantswarm.io'
      );

      throw error;
    }
  },
  shouldPerform: () => true,
  throwOnError: false,
});

interface IInstallAppRequestApp {
  name: string;
  valuesYAML: string;
  secretsYAML: string;
  catalog: string;
  namespace: string;
  version: string;
  chartName: string;
}

interface IInstallAppRequest {
  clusterId: string;
  app: IInstallAppRequestApp;
}

interface IInstallAppResponse {
  clusterId: string;
}

export const installApp = createAsynchronousAction<
  IInstallAppRequest,
  IState,
  IInstallAppResponse
>({
  actionTypePrefix: 'INSTALL_APP',

  perform: async (state, dispatch, payload) => {
    if (!payload) {
      throw new TypeError('action payload cannot be empty');
    }

    const {
      name,
      valuesYAML,
      secretsYAML,
      catalog,
      chartName,
      namespace,
      version,
    } = payload.app;

    const clusterId = payload.clusterId;

    await dispatch(createAppConfig(name, clusterId, valuesYAML));
    await dispatch(createAppSecret(name, clusterId, secretsYAML));

    const request = {
      body: {
        spec: {
          catalog: catalog,
          name: chartName,
          namespace: namespace,
          version: version,
        },
      },
    };

    const appsApi = new GiantSwarm.AppsApi();

    const createApp = v4orV5(
      appsApi.createClusterAppV4.bind(appsApi),
      appsApi.createClusterAppV5.bind(appsApi),
      payload.clusterId,
      state
    );

    try {
      await createApp(clusterId, name, request);
    } catch (error) {
      showAppInstallationErrorFlashMessage(name, clusterId, error);
      throw error;
    }

    new FlashMessage(
      `Your app <code>${name}</code> is being installed on <code>${clusterId}</code>`,
      messageType.SUCCESS,
      messageTTL.MEDIUM
    );

    return {
      clusterId: clusterId,
    };
  },
  shouldPerform: () => true,
  throwOnError: true,
});

/**
 * appInstallationErrorFlashMessage provides flash messages for failed app creation.
 *
 * @param {string} appName Name of the app.
 * @param {string} clusterID Where we tried to install the app on.
 * @param {object} error The error that occured.
 */
function showAppInstallationErrorFlashMessage(
  appName: string,
  clusterID: string,
  error: { status: number }
) {
  if (error.status === StatusCodes.Conflict) {
    new FlashMessage(
      `An app called <code>${appName}</code> already exists on cluster <code>${clusterID}</code>`,
      messageType.ERROR,
      messageTTL.LONG
    );
  } else if (error.status === StatusCodes.ServiceUnavailable) {
    new FlashMessage(
      `The cluster is not yet ready for app installation. Please try again in 5 to 10 minutes.`,
      messageType.ERROR,
      messageTTL.LONG
    );
  } else if (error.status === StatusCodes.BadRequest) {
    new FlashMessage(
      `Your input appears to be invalid. Please make sure all fields are filled in correctly.`,
      messageType.ERROR,
      messageTTL.LONG
    );
  } else {
    new FlashMessage(
      `Something went wrong while trying to install your app. Please try again later or contact support: support@giantswarm.io`,
      messageType.ERROR,
      messageTTL.LONG
    );
  }
}
