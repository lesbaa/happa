import { useAuthProvider } from 'Auth/MAPI/MapiAuthProvider';
import { Box, Keyboard, Text } from 'grommet';
import { usePermissionsForReleases } from 'MAPI/releases/permissions/usePermissionsForReleases';
import { ClusterList } from 'MAPI/types';
import {
  fetchClusterList,
  fetchClusterListKey,
  fetchProviderClustersForClusters,
  fetchProviderClustersForClustersKey,
  IProviderClusterForClusterName,
} from 'MAPI/utils';
import { GenericResponseError } from 'model/clients/GenericResponseError';
import { OrganizationsRoutes } from 'model/constants/routes';
import * as releasev1alpha1 from 'model/services/mapi/releasev1alpha1';
import { selectOrganizations } from 'model/stores/organization/selectors';
import { IState } from 'model/stores/state';
import React, { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { TransitionGroup } from 'react-transition-group';
import DocumentTitle from 'shared/DocumentTitle';
import styled from 'styled-components';
import BaseTransition from 'styles/transitions/BaseTransition';
import useSWR from 'swr';
import Button from 'UI/Controls/Button';
import ClusterListEmptyPlaceholder from 'UI/Display/MAPI/clusters/ClusterList/ClusterListEmptyPlaceholder';
import ClusterListErrorPlaceholder from 'UI/Display/MAPI/clusters/ClusterList/ClusterListErrorPlaceholder';
import ClusterListNoOrgsPlaceholder from 'UI/Display/MAPI/clusters/ClusterList/ClusterListNoOrgsPlaceholder';
import ErrorReporter from 'utils/errors/ErrorReporter';
import { FlashMessage, messageTTL, messageType } from 'utils/flashMessage';
import { useHttpClientFactory } from 'utils/hooks/useHttpClientFactory';
import RoutePath from 'utils/routePath';

import ClusterListItem from './ClusterList/ClusterListItem';
import ListClustersGuide from './guides/ListClustersGuide';
import { usePermissionsForClusters } from './permissions/usePermissionsForClusters';
import { compareClusters, mapClustersToProviderClusters } from './utils';

const LOADING_COMPONENTS = new Array(6).fill(0);

const AnimationWrapper = styled.div`
  .cluster-list-item-enter {
    opacity: 0.01;
    transform: translate3d(-50px, 0, 0);
  }
  .cluster-list-item-enter.cluster-list-item-enter-active {
    opacity: 1;
    transform: translate3d(0, 0, 0);
    transition: 0.2s cubic-bezier(1, 0, 0, 1);
  }
  .cluster-list-item-exit {
    opacity: 1;
  }
  .cluster-list-item-exit.cluster-list-item-exit-active {
    opacity: 0.01;
    transform: translate3d(-50px, 0, 0);
    transition: 0.2s cubic-bezier(1, 0, 0, 1);
  }
`;

// eslint-disable-next-line complexity
const Clusters: React.FC<{}> = () => {
  const selectedOrgName = useSelector(
    (state: IState) => state.main.selectedOrganization
  );
  const organizations = useSelector(selectOrganizations());
  const selectedOrg = selectedOrgName
    ? organizations[selectedOrgName]
    : undefined;
  const selectedOrgID = selectedOrg?.name ?? selectedOrg?.id;
  const hasOrgs = Object.values(organizations).length > 0;

  const clientFactory = useHttpClientFactory();
  const auth = useAuthProvider();

  const namespace = selectedOrg?.namespace;
  const provider = window.config.info.general.provider;

  const {
    canList: canListClusters,
    canGet: canGetClusters,
    canCreate: canCreateClusters,
  } = usePermissionsForClusters(provider, namespace ?? '');

  const hasReadPermissionsForClusters = canListClusters && canGetClusters;

  const clusterListKey = hasReadPermissionsForClusters
    ? fetchClusterListKey(provider, namespace, selectedOrgID)
    : null;

  const {
    data: clusterList,
    error: clusterListError,
    isValidating: clusterListIsValidating,
  } = useSWR<ClusterList, GenericResponseError>(clusterListKey, () =>
    fetchClusterList(clientFactory, auth, provider, namespace, selectedOrgID)
  );

  useEffect(() => {
    if (clusterListError) {
      ErrorReporter.getInstance().notify(clusterListError);
    }
  }, [clusterListError]);

  const providerClusterKey = clusterList
    ? fetchProviderClustersForClustersKey(clusterList.items)
    : null;

  const {
    data: providerClusterList,
    error: providerClusterListError,
    isValidating: providerClusterListIsValidating,
  } = useSWR<IProviderClusterForClusterName[], GenericResponseError>(
    providerClusterKey,
    () =>
      fetchProviderClustersForClusters(clientFactory, auth, clusterList!.items)
  );

  useEffect(() => {
    if (providerClusterListError) {
      new FlashMessage(
        'There was a problem loading the cluster list.',
        messageType.ERROR,
        messageTTL.MEDIUM,
        providerClusterListError
      );

      ErrorReporter.getInstance().notify(providerClusterListError);
    }
  }, [providerClusterListError]);

  const clusterListIsLoading =
    (typeof clusterList === 'undefined' &&
      typeof clusterListError === 'undefined' &&
      clusterListIsValidating) ||
    (typeof providerClusterList === 'undefined' &&
      typeof providerClusterListError === 'undefined' &&
      providerClusterListIsValidating);

  const sortedClustersWithProviderClusters = useMemo(() => {
    if (!clusterList?.items || !providerClusterList) return undefined;

    return mapClustersToProviderClusters(
      clusterList.items,
      providerClusterList
    ).sort(compareClusters);
  }, [clusterList?.items, providerClusterList]);

  const newClusterPath = useMemo(() => {
    if (!selectedOrg) return '';

    return RoutePath.createUsablePath(OrganizationsRoutes.Clusters.New, {
      orgId: selectedOrg.id,
    });
  }, [selectedOrg]);

  const title = selectedOrgName
    ? `Cluster Overview | ${selectedOrgName}`
    : 'Cluster Overview';

  const hasNoClusters =
    hasOrgs &&
    namespace &&
    !clusterListIsLoading &&
    sortedClustersWithProviderClusters?.length === 0;

  const hasError =
    hasOrgs &&
    namespace &&
    (typeof clusterListError !== 'undefined' ||
      typeof providerClusterListError !== 'undefined') &&
    typeof sortedClustersWithProviderClusters === 'undefined';

  const releaseListClient = useRef(clientFactory());

  const { canList: canListReleases } = usePermissionsForReleases(
    provider,
    'default'
  );

  const releaseListKey = canListReleases
    ? releasev1alpha1.getReleaseListKey()
    : null;

  const { data: releaseList, error: releaseListError } = useSWR<
    releasev1alpha1.IReleaseList,
    GenericResponseError
  >(releaseListKey, () =>
    releasev1alpha1.getReleaseList(releaseListClient.current, auth)
  );

  useEffect(() => {
    if (releaseListError) {
      ErrorReporter.getInstance().notify(releaseListError);
    }
  }, [releaseListError]);

  return (
    <DocumentTitle title={title}>
      <Box direction='column' gap='medium'>
        {selectedOrgName && (
          <Box
            pad='medium'
            background='background-front'
            round='xsmall'
            direction='row'
            align='center'
          >
            {canCreateClusters ? (
              <>
                <Link to={newClusterPath}>
                  <Button
                    primary={true}
                    tabIndex={-1}
                    icon={<i className='fa fa-add-circle' />}
                  >
                    Launch new cluster
                  </Button>
                </Link>

                {hasNoClusters && (
                  <Text margin={{ left: 'small' }}>
                    Ready to launch your first cluster? Click the green button!
                  </Text>
                )}
              </>
            ) : (
              <>
                <Button
                  primary={true}
                  tabIndex={-1}
                  icon={<i className='fa fa-add-circle' />}
                  disabled={true}
                  unauthorized={true}
                >
                  Launch new cluster
                </Button>
                <Text color='text-weak' margin={{ left: 'small' }}>
                  For creating a cluster, you need additional permissions.
                  Please talk to your administrator.
                </Text>
              </>
            )}
          </Box>
        )}

        <Box>
          {hasError && (
            <ClusterListErrorPlaceholder organizationName={selectedOrgName!} />
          )}

          {hasNoClusters && (
            <ClusterListEmptyPlaceholder
              organizationName={selectedOrgName!}
              canCreateClusters={canCreateClusters}
            />
          )}

          {!hasOrgs && <ClusterListNoOrgsPlaceholder />}

          {clusterListIsLoading &&
            LOADING_COMPONENTS.map((_, idx) => (
              <ClusterListItem key={idx} margin={{ bottom: 'medium' }} />
            ))}

          <Keyboard
            onSpace={(e) => {
              e.preventDefault();

              (e.target as HTMLElement).click();
            }}
          >
            <AnimationWrapper>
              <TransitionGroup>
                {!clusterListIsLoading &&
                  sortedClustersWithProviderClusters?.map(
                    ({ cluster, providerCluster }) => (
                      <BaseTransition
                        in={false}
                        key={cluster.metadata.name}
                        appear={false}
                        exit={true}
                        timeout={{ enter: 200, exit: 200 }}
                        delayTimeout={0}
                        classNames='cluster-list-item'
                      >
                        <ClusterListItem
                          cluster={cluster}
                          providerCluster={providerCluster}
                          releases={releaseList?.items}
                          organizations={organizations}
                          canCreateClusters={canCreateClusters}
                          canListReleases={canListReleases}
                          margin={{ bottom: 'medium' }}
                        />
                      </BaseTransition>
                    )
                  )}
              </TransitionGroup>
            </AnimationWrapper>
          </Keyboard>
        </Box>
        {namespace && (
          <Box margin={{ top: 'medium' }} direction='column' gap='small'>
            <ListClustersGuide namespace={namespace} />
          </Box>
        )}
      </Box>
    </DocumentTitle>
  );
};

export default Clusters;
