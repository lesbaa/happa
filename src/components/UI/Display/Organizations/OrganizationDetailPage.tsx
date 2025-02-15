import { Box, Text } from 'grommet';
import OrganizationDetailDelete from 'MAPI/organizations/OrganizationDetailDelete';
import React from 'react';
import { getK8sVersionEOLDate } from 'utils/config';

import KubernetesVersionLabel from '../Cluster/KubernetesVersionLabel';
import OrganizationDetailStatistic from './OrganizationDetailStatistic';
import {
  IOrganizationDetailAppsSummary,
  IOrganizationDetailClustersSummary,
  IOrganizationDetailReleasesSummary,
} from './types';

function formatMemory(value?: number): string | undefined {
  if (typeof value === 'undefined') return undefined;

  return `${Math.round(value)} GB`;
}

function formatCPU(value?: number): number | undefined {
  if (typeof value === 'undefined') return undefined;

  return Math.round(value);
}

interface IOrganizationDetailPageProps {
  organizationName: string;
  organizationNamespace: string;
  onDelete: () => Promise<void>;
  canDeleteOrganizations?: boolean;
  clusterCount?: number;
  clusterCountLoading?: boolean;
  clustersSummary?: IOrganizationDetailClustersSummary;
  clustersSummaryLoading?: boolean;
  releasesSummary?: IOrganizationDetailReleasesSummary;
  releasesSummaryLoading?: boolean;
  appsSummary?: IOrganizationDetailAppsSummary;
  appsSummaryLoading?: boolean;
}

const OrganizationDetailPage: React.FC<IOrganizationDetailPageProps> = ({
  organizationName,
  organizationNamespace,
  onDelete,
  canDeleteOrganizations,
  clusterCount,
  clusterCountLoading,
  clustersSummary,
  clustersSummaryLoading,
  releasesSummary,
  releasesSummaryLoading,
  appsSummary,
  appsSummaryLoading,
}) => {
  const { oldestReleaseK8sVersion, newestReleaseK8sVersion } =
    releasesSummary ?? {};
  const oldestReleaseK8sVersionEOLDate = oldestReleaseK8sVersion
    ? getK8sVersionEOLDate(oldestReleaseK8sVersion) ?? undefined
    : undefined;
  const newestReleaseK8sVersionEOLDate = newestReleaseK8sVersion
    ? getK8sVersionEOLDate(newestReleaseK8sVersion) ?? undefined
    : undefined;

  return (
    <Box direction='column' gap='large'>
      <Box direction='row' gap='large'>
        <Box width='small'>
          <Text weight='bold' size='large' margin='none'>
            Clusters summary
          </Text>
        </Box>
        <Box direction='row' gap='small'>
          <Box width='medium' direction='column' gap='xsmall'>
            <Text>Workload clusters</Text>
            <Text>Control plane nodes</Text>
            <Text>Worker nodes</Text>
            <Text>Memory in control plane nodes</Text>
            <Text>Memory in worker nodes</Text>
            <Text>CPU in control plane nodes</Text>
            <Text>CPU in worker nodes</Text>
          </Box>
          <Box direction='column' gap='xsmall'>
            <OrganizationDetailStatistic
              isLoading={clusterCountLoading}
              aria-label='Workload clusters'
            >
              {clusterCount}
            </OrganizationDetailStatistic>
            <OrganizationDetailStatistic
              isLoading={clustersSummaryLoading}
              aria-label='Control plane nodes'
            >
              {clustersSummary?.nodesCount}
            </OrganizationDetailStatistic>
            <OrganizationDetailStatistic
              isLoading={clustersSummaryLoading}
              aria-label='Worker nodes'
            >
              {clustersSummary?.workerNodesCount}
            </OrganizationDetailStatistic>
            <OrganizationDetailStatistic
              isLoading={clustersSummaryLoading}
              aria-label='Memory in control plane nodes'
            >
              {formatMemory(clustersSummary?.nodesMemory)}
            </OrganizationDetailStatistic>
            <OrganizationDetailStatistic
              isLoading={clustersSummaryLoading}
              aria-label='Memory in worker nodes'
            >
              {formatMemory(clustersSummary?.workerNodesMemory)}
            </OrganizationDetailStatistic>
            <OrganizationDetailStatistic
              isLoading={clustersSummaryLoading}
              aria-label='CPU in control plane nodes'
            >
              {formatCPU(clustersSummary?.nodesCPU)}
            </OrganizationDetailStatistic>
            <OrganizationDetailStatistic
              isLoading={clustersSummaryLoading}
              aria-label='CPU in worker nodes'
            >
              {formatCPU(clustersSummary?.workerNodesCPU)}
            </OrganizationDetailStatistic>
          </Box>
        </Box>
      </Box>
      <Box direction='row' gap='large'>
        <Box width='small'>
          <Text weight='bold' size='large' margin='none'>
            Releases
          </Text>
        </Box>
        <Box direction='row' gap='small'>
          <Box width='medium' direction='column' gap='xsmall'>
            <Text>Oldest release</Text>
            <Text>Newest release</Text>
            <Text>Releases in use</Text>
          </Box>
          <Box direction='column' gap='xsmall'>
            <Box direction='row' gap='small'>
              <OrganizationDetailStatistic
                isLoading={releasesSummaryLoading}
                aria-label='Oldest release'
              >
                {releasesSummary?.oldestReleaseVersion}
              </OrganizationDetailStatistic>
              <OrganizationDetailStatistic
                isLoading={releasesSummaryLoading}
                aria-label='Oldest release Kubernetes version'
              >
                <KubernetesVersionLabel
                  version={oldestReleaseK8sVersion}
                  eolDate={oldestReleaseK8sVersionEOLDate}
                  hidePatchVersion={true}
                />
              </OrganizationDetailStatistic>
            </Box>
            <Box direction='row' gap='small'>
              <OrganizationDetailStatistic
                isLoading={releasesSummaryLoading}
                aria-label='Newest release'
              >
                {releasesSummary?.newestReleaseVersion}
              </OrganizationDetailStatistic>
              <OrganizationDetailStatistic
                isLoading={releasesSummaryLoading}
                aria-label='Newest release Kubernetes version'
              >
                <KubernetesVersionLabel
                  version={newestReleaseK8sVersion}
                  eolDate={newestReleaseK8sVersionEOLDate}
                  hidePatchVersion={true}
                />
              </OrganizationDetailStatistic>
            </Box>
            <OrganizationDetailStatistic
              isLoading={releasesSummaryLoading}
              aria-label='Releases in use'
            >
              {releasesSummary?.releasesInUseCount}
            </OrganizationDetailStatistic>
          </Box>
        </Box>
      </Box>
      <Box direction='row' gap='large'>
        <Box width='small'>
          <Text weight='bold' size='large' margin='none'>
            Apps summary
          </Text>
        </Box>
        <Box direction='row' gap='small'>
          <Box width='medium' direction='column' gap='xsmall'>
            <Text>Apps in use</Text>
            <Text>App deployments</Text>
          </Box>
          <Box direction='column' gap='xsmall'>
            <OrganizationDetailStatistic
              isLoading={appsSummaryLoading}
              aria-label='Apps in use'
            >
              {appsSummary?.appsInUseCount}
            </OrganizationDetailStatistic>
            <OrganizationDetailStatistic
              isLoading={appsSummaryLoading}
              aria-label='App deployments'
            >
              {appsSummary?.appDeploymentsCount}
            </OrganizationDetailStatistic>
          </Box>
        </Box>
      </Box>

      {!clusterCountLoading && (
        <OrganizationDetailDelete
          organizationName={organizationName}
          organizationNamespace={organizationNamespace}
          onDelete={onDelete}
          canDeleteOrganizations={canDeleteOrganizations}
          clusterCount={clusterCount}
          border='top'
        />
      )}
    </Box>
  );
};

export default OrganizationDetailPage;
