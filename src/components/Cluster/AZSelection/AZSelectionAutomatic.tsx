import AvailabilityZonesParser from 'Cluster/ClusterDetail/AvailabilityZonesParser';
import { Box, Text } from 'grommet';
import * as React from 'react';
import styled from 'styled-components';

import {
  AvailabilityZoneSelection,
  AZSelectionVariants,
  AZSelectionZonesUpdater,
  AZSelectorWrapper,
} from './AZSelectionUtils';

const StyledAZSelectorWrapper = styled(AZSelectorWrapper)`
  align-items: baseline;
`;

interface IAZSelectionAutomaticProps {
  onUpdateZones: AZSelectionZonesUpdater;
  variant: AZSelectionVariants;
  allZones: string[];
  minNumOfZones: number;
  maxNumOfZones: number;
  defaultNumOfZones: number;
  numOfZones: number;
}

const AZSelectionAutomatic: React.FC<IAZSelectionAutomaticProps> = ({
  onUpdateZones,
  variant,
  allZones,
  minNumOfZones,
  maxNumOfZones,
  defaultNumOfZones,
  numOfZones,
}) => {
  if (variant === AZSelectionVariants.Master) {
    return (
      <Text>
        An availabilty zone will be automatically chosen from the existing ones.
      </Text>
    );
  }

  let automaticAZSelectionMessage =
    'Availability zones will be selected randomly.';
  if (numOfZones < 2) {
    automaticAZSelectionMessage = `Covering one availability zone, the worker nodes of this node pool will be placed in the same availability zone as the cluster's control plane node.`;
  }

  return (
    <>
      <StyledAZSelectorWrapper>
        <Box>
          <Text>Number of availability zones to use</Text>
        </Box>
        <AvailabilityZonesParser
          min={minNumOfZones}
          max={maxNumOfZones}
          defaultValue={defaultNumOfZones}
          zones={allZones}
          updateAZValuesInParent={onUpdateZones(
            AvailabilityZoneSelection.Automatic
          )}
          isLabels={false}
        />
      </StyledAZSelectorWrapper>
      <Text>{automaticAZSelectionMessage}</Text>
    </>
  );
};

export default AZSelectionAutomatic;
