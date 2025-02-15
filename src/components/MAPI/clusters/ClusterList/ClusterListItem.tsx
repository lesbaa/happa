import { useAuthProvider } from 'Auth/MAPI/MapiAuthProvider';
import { push } from 'connected-react-router';
import differenceInHours from 'date-fns/fp/differenceInHours';
import toDate from 'date-fns-tz/toDate';
import { Box, Card, CardBody, Text } from 'grommet';
import { usePermissionsForKeyPairs } from 'MAPI/keypairs/permissions/usePermissionsForKeyPairs';
import { NodePoolList, ProviderCluster } from 'MAPI/types';
import {
  extractErrorMessage,
  fetchNodePoolListForCluster,
  fetchNodePoolListForClusterKey,
  fetchProviderNodePoolsForNodePools,
  fetchProviderNodePoolsForNodePoolsKey,
  getClusterDescription,
  getMachineTypes,
  IProviderNodePoolForNodePoolName,
} from 'MAPI/utils';
import { usePermissionsForNodePools } from 'MAPI/workernodes/permissions/usePermissionsForNodePools';
import { mapNodePoolsToProviderNodePools } from 'MAPI/workernodes/utils';
import { GenericResponseError } from 'model/clients/GenericResponseError';
import { OrganizationsRoutes } from 'model/constants/routes';
import * as capiv1alpha3 from 'model/services/mapi/capiv1alpha3';
import * as releasev1alpha1 from 'model/services/mapi/releasev1alpha1';
import { getUserIsAdmin } from 'model/stores/main/selectors';
import React, { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import useSWR from 'swr';
import Button from 'UI/Controls/Button';
import ClusterIDLabel, {
  ClusterIDLabelType,
} from 'UI/Display/Cluster/ClusterIDLabel';
import FormattedDate from 'UI/Display/Date';
import ClusterListItemMainInfo from 'UI/Display/MAPI/clusters/ClusterList/ClusterListItemMainInfo';
import ClusterListItemNodeInfo from 'UI/Display/MAPI/clusters/ClusterList/ClusterListItemNodeInfo';
import OptionalValue from 'UI/Display/OptionalValue/OptionalValue';
import ErrorReporter from 'utils/errors/ErrorReporter';
import { useHttpClientFactory } from 'utils/hooks/useHttpClientFactory';
import RoutePath from 'utils/routePath';

import {
  getWorkerNodesCount,
  getWorkerNodesCPU,
  getWorkerNodesMemory,
} from '../utils';
import ClusterListItemStatus from './ClusterListItemStatus';

const StyledLink = styled(Link)`
  transition: box-shadow 0.1s ease-in-out;
  display: block;
  border-radius: ${(props) => props.theme.rounding}px;

  :hover,
  :focus {
    text-decoration: none;
    outline: none;
    box-shadow: ${(props) =>
      `0 0 0 1px ${props.theme.global.colors.text.dark}`};
  }

  &[aria-disabled='true'] {
    cursor: default;

    :hover,
    :focus {
      box-shadow: none;
    }
  }
`;

interface IClusterListItemProps
  extends React.ComponentPropsWithoutRef<typeof Box> {
  cluster?: capiv1alpha3.ICluster;
  providerCluster?: ProviderCluster | null;
  releases?: releasev1alpha1.IRelease[];
  organizations?: Record<string, IOrganization>;
  canCreateClusters?: boolean;
  canListReleases?: boolean;
}

// eslint-disable-next-line complexity
const ClusterListItem: React.FC<IClusterListItemProps> = ({
  cluster,
  providerCluster,
  releases,
  organizations,
  canCreateClusters,
  canListReleases,
  ...props
}) => {
  const name = cluster?.metadata.name;
  const description = useMemo(() => {
    if (!cluster || typeof providerCluster === 'undefined') return undefined;

    return getClusterDescription(cluster, providerCluster, '');
  }, [cluster, providerCluster]);

  const releaseVersion = cluster
    ? capiv1alpha3.getReleaseVersion(cluster)
    : undefined;

  const organization = useMemo(() => {
    if (!organizations || !cluster) return undefined;

    const org = capiv1alpha3.getClusterOrganization(cluster);
    if (!org) return undefined;

    return Object.values(organizations).find(
      (o) => o.name === org || o.id === org
    );
  }, [cluster, organizations]);

  const orgId = organization?.id;

  const creationDate = cluster?.metadata.creationTimestamp;
  const deletionDate = cluster?.metadata.deletionTimestamp;

  const clusterPath = useMemo(() => {
    if (!orgId || !name) return '';

    return RoutePath.createUsablePath(
      OrganizationsRoutes.Clusters.Detail.Home,
      {
        orgId: orgId,
        clusterId: name,
      }
    );
  }, [orgId, name]);

  const release = useMemo(() => {
    const formattedReleaseVersion = `v${releaseVersion}`;

    if (!releases) return undefined;

    return releases.find((r) => r.metadata.name === formattedReleaseVersion);
  }, [releases, releaseVersion]);

  const k8sVersion = useMemo(() => {
    // if releases and permissions are loading, show loading placeholder
    if (!releases && typeof canListReleases === 'undefined') return undefined;
    if (typeof release === 'undefined') return '';

    return releasev1alpha1.getK8sVersion(release) ?? '';
  }, [canListReleases, release, releases]);

  const isPreviewRelease = release?.spec.state === 'preview';

  const provider = window.config.info.general.provider;

  const clientFactory = useHttpClientFactory();
  const auth = useAuthProvider();

  const { canList: canListNodePools, canGet: canGetNodePools } =
    usePermissionsForNodePools(provider, cluster?.metadata.namespace ?? '');

  const hasReadPermissionsForNodePools = canListNodePools && canGetNodePools;

  const nodePoolListForClusterKey =
    hasReadPermissionsForNodePools && cluster
      ? fetchNodePoolListForClusterKey(cluster, cluster.metadata.namespace)
      : null;

  const { data: nodePoolList, error: nodePoolListError } = useSWR<
    NodePoolList,
    GenericResponseError
  >(nodePoolListForClusterKey, () =>
    fetchNodePoolListForCluster(
      clientFactory,
      auth,
      cluster,
      cluster!.metadata.namespace
    )
  );

  useEffect(() => {
    if (nodePoolListError) {
      ErrorReporter.getInstance().notify(nodePoolListError);
    }
  }, [nodePoolListError]);

  const { data: providerNodePools, error: providerNodePoolsError } = useSWR<
    IProviderNodePoolForNodePoolName[],
    GenericResponseError
  >(fetchProviderNodePoolsForNodePoolsKey(nodePoolList?.items), () =>
    fetchProviderNodePoolsForNodePools(clientFactory, auth, nodePoolList!.items)
  );

  useEffect(() => {
    if (providerNodePoolsError) {
      ErrorReporter.getInstance().notify(providerNodePoolsError);
    }
  }, [providerNodePoolsError]);

  const machineTypes = useRef(getMachineTypes());

  const nodePoolsWithProviderNodePools = useMemo(() => {
    if (!nodePoolList?.items || !providerNodePools) return undefined;

    return mapNodePoolsToProviderNodePools(
      nodePoolList.items,
      providerNodePools
    );
  }, [nodePoolList?.items, providerNodePools]);

  const workerNodesCPU =
    providerNodePoolsError || !hasReadPermissionsForNodePools
      ? -1
      : getWorkerNodesCPU(nodePoolsWithProviderNodePools, machineTypes.current);
  const workerNodesMemory =
    providerNodePoolsError || !hasReadPermissionsForNodePools
      ? -1
      : getWorkerNodesMemory(
          nodePoolsWithProviderNodePools,
          machineTypes.current
        );

  const isAdmin = useSelector(getUserIsAdmin);

  const workerNodePoolsCount = hasReadPermissionsForNodePools
    ? nodePoolList?.items.length
    : -1;
  const workerNodesCount = hasReadPermissionsForNodePools
    ? getWorkerNodesCount(nodePoolList?.items)
    : -1;

  const isDeleting = Boolean(deletionDate);
  const hasError = typeof nodePoolListError !== 'undefined';
  const isLoading = typeof cluster === 'undefined';

  const selectedOrg = organizations && orgId ? organizations[orgId] : undefined;
  const namespace = selectedOrg?.namespace;
  const { canCreate: canCreateKeyPairs } = usePermissionsForKeyPairs(
    provider,
    namespace ?? ''
  );

  const clusterInOrgNamespace = cluster?.metadata.namespace !== 'default';

  const shouldDisplayGetStarted = useMemo(() => {
    if (
      isDeleting ||
      isLoading ||
      !creationDate ||
      !canCreateKeyPairs ||
      isPreviewRelease ||
      !clusterInOrgNamespace
    )
      return false;

    const createDate = toDate(creationDate, { timeZone: 'UTC' });
    const age = differenceInHours(createDate)(new Date());

    // Cluster is older than 30 days.
    // eslint-disable-next-line no-magic-numbers
    return age < 30 * 24;
  }, [
    isDeleting,
    isLoading,
    creationDate,
    canCreateKeyPairs,
    isPreviewRelease,
    clusterInOrgNamespace,
  ]);

  const dispatch = useDispatch();

  const handleGetStartedClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();

    if (!orgId || !name) return;

    const path = RoutePath.createUsablePath(
      OrganizationsRoutes.Clusters.GettingStarted.Overview,
      {
        orgId: orgId,
        clusterId: name,
      }
    );

    dispatch(push(path));
  };

  const disableNavigation = isDeleting || isLoading || isPreviewRelease;

  return (
    <StyledLink
      to={disableNavigation ? '' : clusterPath}
      aria-label={isLoading ? 'Loading cluster...' : `Cluster ${name}`}
      aria-disabled={disableNavigation}
      tabIndex={disableNavigation ? -1 : 0}
    >
      <Card
        direction='row'
        elevation='none'
        overflow='visible'
        background={isDeleting ? 'background-back' : 'background-front'}
        round='xsmall'
        pad='medium'
        gap='small'
        {...props}
      >
        <CardBody direction='row' gap='xsmall' wrap={true}>
          <Box>
            <OptionalValue value={name}>
              {(value) => (
                <Text size='large' aria-label={`Name: ${value}`}>
                  <ClusterIDLabel
                    clusterID={value as string}
                    variant={ClusterIDLabelType.Name}
                    copyEnabled={true}
                  />
                </Text>
              )}
            </OptionalValue>
          </Box>
          <Box basis='75%'>
            <Box direction='row' align='center' wrap={true} gap='small'>
              <OptionalValue value={description}>
                {(value) => (
                  <Text
                    weight='bold'
                    size='large'
                    aria-label={`Description: ${value}`}
                  >
                    {value}
                  </Text>
                )}
              </OptionalValue>

              {cluster && providerCluster && (
                <ClusterListItemStatus
                  cluster={cluster}
                  providerCluster={providerCluster}
                  provider={provider}
                  isAdmin={isAdmin}
                  releases={releases}
                />
              )}
            </Box>

            {isDeleting ? (
              <Text color='text-xweak'>
                Deleted <FormattedDate relative={true} value={deletionDate} />
              </Text>
            ) : (
              <ClusterListItemMainInfo
                creationDate={creationDate}
                releaseVersion={releaseVersion}
                isPreviewRelease={isPreviewRelease}
                k8sVersion={k8sVersion}
              />
            )}

            {!hasError && !isDeleting && !isPreviewRelease && (
              <ClusterListItemNodeInfo
                workerNodePoolsCount={workerNodePoolsCount}
                workerNodesCPU={workerNodesCPU}
                workerNodesCount={workerNodesCount}
                workerNodesMemory={workerNodesMemory}
              />
            )}

            {hasError && !isDeleting && (
              <Text color='status-critical' aria-label='Cluster load error'>
                {extractErrorMessage(nodePoolListError)}
              </Text>
            )}
          </Box>

          {shouldDisplayGetStarted && (
            <Box
              align='end'
              basis='15%'
              width={{ min: '120px' }}
              flex={{ grow: 1 }}
            >
              <Button
                onClick={handleGetStartedClick}
                icon={
                  <i
                    className='fa fa-start'
                    aria-hidden={true}
                    role='presentation'
                  />
                }
              >
                Get started
              </Button>
            </Box>
          )}
        </CardBody>
      </Card>
    </StyledLink>
  );
};

export default ClusterListItem;
