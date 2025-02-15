import { render, screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { StatusCodes } from 'model/constants';
import * as applicationv1alpha1 from 'model/services/mapi/applicationv1alpha1';
import nock from 'nock';
import React from 'react';
import { SWRConfig } from 'swr';
import { generateRandomString } from 'test/mockHttpCalls';
import * as applicationv1alpha1Mocks from 'test/mockHttpCalls/applicationv1alpha1';
import * as mockCapiv1alpha3 from 'test/mockHttpCalls/capiv1alpha3';
import { getComponentWithStore } from 'test/renderUtils';
import TestOAuth2 from 'utils/OAuth2/TestOAuth2';

import ClusterDetailWidgetApps from '../ClusterDetailWidgetApps';
import { IAppsPermissions } from '../permissions/types';
import { usePermissionsForAppCatalogEntries } from '../permissions/usePermissionsForAppCatalogEntries';
import { usePermissionsForApps } from '../permissions/usePermissionsForApps';
import { usePermissionsForCatalogs } from '../permissions/usePermissionsForCatalogs';

function generateApp(
  specName: string = 'some-app',
  status = 'deployed' as 'deployed' | 'not-deployed',
  version: string = '1.0.1'
): applicationv1alpha1.IApp {
  const appName = generateRandomString();
  const namespace = mockCapiv1alpha3.randomCluster1.metadata.name;

  return {
    apiVersion: 'application.giantswarm.io/v1alpha1',
    kind: 'App',
    metadata: {
      annotations: {
        'chart-operator.giantswarm.io/force-helm-upgrade': 'true',
      },
      creationTimestamp: new Date().toISOString(),
      finalizers: ['operatorkit.giantswarm.io/app-operator-app'],
      generation: 1,
      labels: {
        app: appName,
        'app-operator.giantswarm.io/version': '3.2.1',
        'giantswarm.io/cluster': namespace,
        'giantswarm.io/managed-by': 'Helm',
        'giantswarm.io/organization': 'org1',
        'giantswarm.io/service-type': 'managed',
      },
      name: appName,
      namespace,
      resourceVersion: '294675096',
      selfLink: `/apis/application.giantswarm.io/v1alpha1/namespaces/${namespace}/apps/${appName}`,
      uid: '859c4eb1-ece4-4eca-85b2-a4a456b6ae81',
    },
    spec: {
      catalog: 'default',
      catalogNamespace: 'default',
      config: {
        configMap: {
          name: `${namespace}-cluster-values`,
          namespace,
        },
        secret: {
          name: '',
          namespace: '',
        },
      },
      kubeConfig: {
        context: {
          name: `${namespace}-kubeconfig`,
        },
        inCluster: false,
        secret: {
          name: `${namespace}-kubeconfig`,
          namespace,
        },
      },
      name: specName,
      namespace: 'giantswarm',
      userConfig: {
        configMap: {
          name: '',
          namespace: '',
        },
        secret: {
          name: '',
          namespace: '',
        },
      },
      version,
    },
    status: {
      appVersion: '0.4.1',
      release: {
        lastDeployed: '2021-04-27T16:21:37Z',
        status,
      },
      version,
    },
  };
}

function getComponent(
  props: React.ComponentPropsWithoutRef<typeof ClusterDetailWidgetApps>
) {
  const history = createMemoryHistory();
  const auth = new TestOAuth2(history, true);

  const Component = (p: typeof props) => (
    <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
      <ClusterDetailWidgetApps {...p} />
    </SWRConfig>
  );

  return getComponentWithStore(
    Component,
    props,
    undefined,
    undefined,
    history,
    auth
  );
}

const defaultPermissions = {
  canGet: true,
  canList: true,
  canUpdate: true,
  canCreate: true,
  canDelete: true,
};

const defaultAppsPermissions: IAppsPermissions = {
  canGet: true,
  canList: true,
  canUpdate: true,
  canCreate: true,
  canDelete: true,
  canConfigure: true,
};

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn().mockReturnValue({
    orgId: 'org1',
    clusterId: mockCapiv1alpha3.randomCluster1.metadata.name,
  }),
}));

jest.mock('MAPI/apps/permissions/usePermissionsForApps');
jest.mock('MAPI/apps/permissions/usePermissionsForCatalogs');
jest.mock('MAPI/apps/permissions/usePermissionsForAppCatalogEntries');

describe('ClusterDetailWidgetApps', () => {
  it('displays loading animations if the cluster is still loading', () => {
    (usePermissionsForApps as jest.Mock).mockReturnValue(
      defaultAppsPermissions
    );
    (usePermissionsForCatalogs as jest.Mock).mockReturnValue(
      defaultPermissions
    );
    (usePermissionsForAppCatalogEntries as jest.Mock).mockReturnValue(
      defaultPermissions
    );

    render(getComponent({}));

    expect(screen.getAllByLabelText('Loading...').length).toEqual(4);
  });

  it('displays a placeholder if there are no apps', async () => {
    (usePermissionsForApps as jest.Mock).mockReturnValue(
      defaultAppsPermissions
    );
    (usePermissionsForCatalogs as jest.Mock).mockReturnValue(
      defaultPermissions
    );
    (usePermissionsForAppCatalogEntries as jest.Mock).mockReturnValue(
      defaultPermissions
    );

    nock(window.config.mapiEndpoint)
      .get(
        `/apis/application.giantswarm.io/v1alpha1/namespaces/${mockCapiv1alpha3.randomCluster1.metadata.name}/apps/`
      )
      .reply(StatusCodes.Ok, {
        apiVersion: 'application.giantswarm.io/v1alpha1',
        kind: applicationv1alpha1.AppList,
        items: [],
        metadata: {
          resourceVersion: '294675100',
          selfLink:
            '/apis/application.giantswarm.io/v1alpha1/namespaces/j5y9m/apps/',
        },
      });

    render(getComponent({}));

    expect(await screen.findByText('No apps installed')).toBeInTheDocument();
    expect(
      screen.getByText((_, node) => {
        return (
          node?.textContent === 'To find apps to install, browse our apps.'
        );
      })
    ).toBeInTheDocument();
  });

  it('does not display a prompt to install apps if the user does not have permissions to do so', async () => {
    (usePermissionsForApps as jest.Mock).mockReturnValue({
      ...defaultAppsPermissions,
      canCreate: false,
    });
    (usePermissionsForCatalogs as jest.Mock).mockReturnValue(
      defaultPermissions
    );
    (usePermissionsForAppCatalogEntries as jest.Mock).mockReturnValue(
      defaultPermissions
    );

    nock(window.config.mapiEndpoint)
      .get(
        `/apis/application.giantswarm.io/v1alpha1/namespaces/${mockCapiv1alpha3.randomCluster1.metadata.name}/apps/`
      )
      .reply(StatusCodes.Ok, {
        apiVersion: 'application.giantswarm.io/v1alpha1',
        kind: applicationv1alpha1.AppList,
        items: [],
        metadata: {
          resourceVersion: '294675100',
          selfLink:
            '/apis/application.giantswarm.io/v1alpha1/namespaces/j5y9m/apps/',
        },
      });

    render(getComponent({}));

    expect(await screen.findByText('No apps installed')).toBeInTheDocument();
    expect(
      screen.queryByText((_, node) => {
        return (
          node?.textContent === 'To find apps to install, browse our apps.'
        );
      })
    ).not.toBeInTheDocument();
  });

  it('displays stats about the apps installed in the cluster', async () => {
    (usePermissionsForApps as jest.Mock).mockReturnValue(
      defaultAppsPermissions
    );
    (usePermissionsForCatalogs as jest.Mock).mockReturnValue(
      defaultPermissions
    );
    (usePermissionsForAppCatalogEntries as jest.Mock).mockReturnValue(
      defaultPermissions
    );

    nock(window.config.mapiEndpoint)
      .get(
        `/apis/application.giantswarm.io/v1alpha1/namespaces/${mockCapiv1alpha3.randomCluster1.metadata.name}/apps/`
      )
      .reply(StatusCodes.Ok, {
        ...applicationv1alpha1Mocks.randomCluster1AppsList,
        items: [
          ...applicationv1alpha1Mocks.randomCluster1AppsList.items,
          generateApp('some-random-app'),
          generateApp(),
          generateApp(undefined, 'not-deployed'),
          generateApp(),
          generateApp('some-random-app'),
          generateApp(),
        ],
      });

    render(getComponent({}));

    expect(await screen.findByLabelText('6 apps')).toBeInTheDocument();
    expect(await screen.findByLabelText('2 unique apps')).toBeInTheDocument();
    expect(await screen.findByLabelText('5 deployed')).toBeInTheDocument();
  });

  it('displays the number of upgradable apps', async () => {
    (usePermissionsForApps as jest.Mock).mockReturnValue(
      defaultAppsPermissions
    );
    (usePermissionsForCatalogs as jest.Mock).mockReturnValue(
      defaultPermissions
    );
    (usePermissionsForAppCatalogEntries as jest.Mock).mockReturnValue(
      defaultPermissions
    );

    nock(window.config.mapiEndpoint)
      .get(
        `/apis/application.giantswarm.io/v1alpha1/namespaces/${mockCapiv1alpha3.randomCluster1.metadata.name}/apps/`
      )
      .reply(StatusCodes.Ok, {
        ...applicationv1alpha1Mocks.randomCluster1AppsList,
        items: [
          generateApp('coredns', 'deployed', '1.2.0'),
          generateApp('coredns', 'deployed', '1.3.0'),
        ],
      });

    nock(window.config.mapiEndpoint)
      .get(
        '/apis/application.giantswarm.io/v1alpha1/namespaces/default/appcatalogentries/?labelSelector=app.kubernetes.io%2Fname%3Dcoredns%2Capplication.giantswarm.io%2Fcatalog%3Ddefault'
      )
      .reply(
        StatusCodes.Ok,
        applicationv1alpha1Mocks.defaultCatalogAppCatalogEntryList
      );

    nock(window.config.mapiEndpoint)
      .get(
        '/apis/application.giantswarm.io/v1alpha1/namespaces/default/appcatalogentries/?labelSelector=app.kubernetes.io%2Fname%3Dcoredns%2Capplication.giantswarm.io%2Fcatalog%3Ddefault'
      )
      .reply(
        StatusCodes.Ok,
        applicationv1alpha1Mocks.defaultCatalogAppCatalogEntryList
      );

    render(getComponent({}));

    expect(await screen.findByLabelText('1 upgradable')).toBeInTheDocument();
  });

  it('does not display the number of upgradable apps if the user does not have permissions to get catalog resources', async () => {
    (usePermissionsForApps as jest.Mock).mockReturnValue(
      defaultAppsPermissions
    );
    (usePermissionsForCatalogs as jest.Mock).mockReturnValue({
      ...defaultPermissions,
      canList: false,
    });
    (usePermissionsForAppCatalogEntries as jest.Mock).mockReturnValue({
      ...defaultPermissions,
      canList: false,
    });

    nock(window.config.mapiEndpoint)
      .get(
        `/apis/application.giantswarm.io/v1alpha1/namespaces/${mockCapiv1alpha3.randomCluster1.metadata.name}/apps/`
      )
      .reply(StatusCodes.Ok, {
        ...applicationv1alpha1Mocks.randomCluster1AppsList,
        items: [
          generateApp('coredns', 'deployed', '1.2.0'),
          generateApp('coredns', 'deployed', '1.3.0'),
        ],
      });

    render(getComponent({}));

    expect(
      await screen.findByLabelText('upgradable not available')
    ).toBeInTheDocument();
  });
});
