import { Box, Text } from 'grommet';
import { ProviderCluster } from 'MAPI/types';
import { Providers } from 'model/constants';
import * as capiv1alpha3 from 'model/services/mapi/capiv1alpha3';
import * as releasev1alpha1 from 'model/services/mapi/releasev1alpha1';
import React, { useMemo } from 'react';
import { useTheme } from 'styled-components';
import { Tooltip, TooltipContainer } from 'UI/Display/Tooltip';
import { formatDate } from 'utils/helpers';

import {
  getClusterConditions,
  getClusterUpdateSchedule,
  isClusterUpgradable,
} from '../utils';

interface IClusterListItemStatusProps {
  cluster: capiv1alpha3.ICluster;
  providerCluster: ProviderCluster;
  isAdmin: boolean;
  provider: PropertiesOf<typeof Providers>;
  releases?: releasev1alpha1.IRelease[];
}

const ClusterListItemStatus: React.FC<IClusterListItemStatusProps> = ({
  cluster,
  providerCluster,
  releases,
  isAdmin,
  provider,
}) => {
  const theme = useTheme();

  const { isConditionUnknown, isCreating, isUpgrading, isDeleting } =
    getClusterConditions(cluster, providerCluster);

  const isUpgradable = useMemo(
    () => isClusterUpgradable(cluster, provider, isAdmin, releases),
    [cluster, provider, isAdmin, releases]
  );

  const clusterUpdateSchedule = getClusterUpdateSchedule(cluster);

  let color = theme.colors.yellow1;
  let iconClassName = '';
  let message = '';
  let tooltip = '';

  switch (true) {
    case isDeleting:
      return null;

    case isConditionUnknown:
    case isCreating:
      color = theme.colors.gray;
      iconClassName = 'fa fa-change-in-progress';
      message = 'Cluster creating…';
      tooltip =
        'The cluster is currently creating. This step usually takes about 15 minutes.';
      break;

    case isUpgrading:
      iconClassName = 'fa fa-version-upgrade';
      message = 'Upgrade in progress…';
      tooltip =
        'The cluster is currently upgrading. This step usually takes about 30 minutes.';
      break;

    case typeof clusterUpdateSchedule !== 'undefined':
      color = theme.colors.gray;
      iconClassName = 'fa fa-version-upgrade';
      message = 'Upgrade scheduled';
      tooltip = `The cluster will upgrade to v${
        clusterUpdateSchedule!.targetRelease
      } on ${formatDate(clusterUpdateSchedule!.targetTime)}`;
      break;

    case isUpgradable:
      iconClassName = 'fa fa-warning';
      message = 'Upgrade available';
      tooltip = `There's a new release version available. Upgrade now to get the latest features.`;
      break;
  }

  return (
    <TooltipContainer content={<Tooltip>{tooltip}</Tooltip>}>
      <Box>
        <Text color={color}>
          <i className={iconClassName} role='presentation' aria-hidden='true' />{' '}
          {message}
        </Text>
      </Box>
    </TooltipContainer>
  );
};

export default ClusterListItemStatus;
