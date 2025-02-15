import { render, screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { StatusCodes } from 'model/constants';
import * as gscorev1alpha1 from 'model/services/mapi/gscorev1alpha1';
import nock from 'nock';
import React from 'react';
import { SWRConfig } from 'swr';
import * as mockCapiv1alpha3 from 'test/mockHttpCalls/capiv1alpha3';
import * as legacyMocks from 'test/mockHttpCalls/legacy';
import { getComponentWithStore } from 'test/renderUtils';
import TestOAuth2 from 'utils/OAuth2/TestOAuth2';

import ClusterDetailWidgetKeyPairs from '../ClusterDetailWidgetKeyPairs';
import { usePermissionsForKeyPairs } from '../permissions/usePermissionsForKeyPairs';

function getComponent(
  props: React.ComponentPropsWithoutRef<typeof ClusterDetailWidgetKeyPairs>
) {
  const history = createMemoryHistory();
  const auth = new TestOAuth2(history, true);

  const Component = (p: typeof props) => (
    <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
      <ClusterDetailWidgetKeyPairs {...p} />
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

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn().mockReturnValue({
    orgId: 'org1',
    clusterId: mockCapiv1alpha3.randomCluster1.metadata.name,
  }),
}));

jest.mock('MAPI/keypairs/permissions/usePermissionsForKeyPairs');

describe('ClusterDetailWidgetKeyPairs', () => {
  it('displays loading animations if the cluster is still loading', () => {
    (usePermissionsForKeyPairs as jest.Mock).mockReturnValue(
      defaultPermissions
    );

    render(getComponent({}));

    expect(screen.getAllByLabelText('Loading...').length).toEqual(1);
  });

  it('displays a placeholder if there are no keypairs', async () => {
    (usePermissionsForKeyPairs as jest.Mock).mockReturnValue(
      defaultPermissions
    );

    nock(window.config.mapiEndpoint)
      .get(
        `/apis/core.giantswarm.io/v1alpha1/namespaces/giantswarm/storageconfigs/cluster-service/`
      )
      .reply(StatusCodes.Ok, {
        apiVersion: 'core.giantswarm.io/v1alpha1',
        kind: gscorev1alpha1.StorageConfig,
        metadata: {
          name: 'cluster-service',
          namespace: 'giantswarm',
          resourceVersion: '294675100',
          selfLink:
            '/apis/core.giantswarm.io/v1alpha1/namespaces/giantswarm/storageconfigs/cluster-service/',
        },
        spec: {
          storage: {
            data: {},
          },
        },
      });

    render(getComponent({}));

    expect(
      await screen.findByText('No client certificates')
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, node) => {
        return node?.textContent === 'Use kubectl gs login to create one.';
      })
    ).toBeInTheDocument();
  });

  it('does not display a link to create keypairs if the user does not have permissions to do so', async () => {
    (usePermissionsForKeyPairs as jest.Mock).mockReturnValue({
      ...defaultPermissions,
      canCreate: false,
    });

    nock(window.config.mapiEndpoint)
      .get(
        `/apis/core.giantswarm.io/v1alpha1/namespaces/giantswarm/storageconfigs/cluster-service/`
      )
      .reply(StatusCodes.Ok, {
        apiVersion: 'core.giantswarm.io/v1alpha1',
        kind: gscorev1alpha1.StorageConfig,
        metadata: {
          name: 'cluster-service',
          namespace: 'giantswarm',
          resourceVersion: '294675100',
          selfLink:
            '/apis/core.giantswarm.io/v1alpha1/namespaces/giantswarm/storageconfigs/cluster-service/',
        },
        spec: {
          storage: {
            data: {},
          },
        },
      });

    render(getComponent({}));

    expect(
      await screen.findByText('No client certificates')
    ).toBeInTheDocument();
    expect(
      screen.queryByText((_, node) => {
        return node?.textContent === 'Use kubectl gs login to create one.';
      })
    ).not.toBeInTheDocument();
  });

  it('displays stats about the keypairs created for this cluster', async () => {
    (usePermissionsForKeyPairs as jest.Mock).mockReturnValue(
      defaultPermissions
    );

    nock(window.config.mapiEndpoint)
      .get(
        `/apis/core.giantswarm.io/v1alpha1/namespaces/giantswarm/storageconfigs/cluster-service/`
      )
      .reply(StatusCodes.Ok, legacyMocks.clusterServiceStorage);

    render(getComponent({}));

    expect(
      await screen.findByLabelText('2 client certificates')
    ).toBeInTheDocument();
  });
});
