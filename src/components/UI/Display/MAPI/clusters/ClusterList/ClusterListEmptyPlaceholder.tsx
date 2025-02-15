import { Box, Heading, Paragraph } from 'grommet';
import * as React from 'react';

interface IClusterListEmptyPlaceholderProps
  extends React.ComponentPropsWithoutRef<typeof Box> {
  organizationName: string;
  canCreateClusters: boolean;
}

const ClusterListEmptyPlaceholder: React.FC<
  IClusterListEmptyPlaceholderProps
> = ({ organizationName, canCreateClusters, ...props }) => {
  return (
    <Box
      pad='medium'
      background='background-back'
      round='xsmall'
      direction='column'
      justify='center'
      align='center'
      height={{ min: 'medium' }}
      {...props}
    >
      <Heading level={1}>
        Couldn&apos;t find any clusters in organization{' '}
        <code>{organizationName}</code>
      </Heading>
      {canCreateClusters && (
        <Paragraph fill={true}>
          Make your first cluster by pressing the green &quot;Launch New
          Cluster&quot; button above.
        </Paragraph>
      )}
      <Paragraph fill={true}>
        You can switch to a different organization by using the organization
        selector at the top right of the page.
      </Paragraph>
    </Box>
  );
};

export default ClusterListEmptyPlaceholder;
