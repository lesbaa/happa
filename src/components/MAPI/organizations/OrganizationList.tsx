import { useAuthProvider } from 'Auth/MAPI/MapiAuthProvider';
import { push } from 'connected-react-router';
import { Box, Text } from 'grommet';
import { ClusterList } from 'MAPI/types';
import { extractErrorMessage } from 'MAPI/utils';
import { GenericResponseError } from 'model/clients/GenericResponseError';
import { OrganizationsRoutes } from 'model/constants/routes';
import { IAsynchronousDispatch } from 'model/stores/asynchronousAction';
import { selectOrganizations } from 'model/stores/organization/selectors';
import { IState } from 'model/stores/state';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DocumentTitle from 'shared/DocumentTitle';
import useSWR, { useSWRConfig } from 'swr';
import Button from 'UI/Controls/Button';
import OrganizationListPage from 'UI/Display/Organizations/OrganizationListPage';
import ErrorReporter from 'utils/errors/ErrorReporter';
import { FlashMessage, messageTTL, messageType } from 'utils/flashMessage';
import { useHttpClientFactory } from 'utils/hooks/useHttpClientFactory';
import RoutePath from 'utils/routePath';

import CreateOrganizationGuide from './guides/CreateOrganizationGuide';
import ListOrganizationsGuide from './guides/ListOrganizationsGuide';
import OrganizationListCreateOrg from './OrganizationListCreateOrg';
import { usePermissionsForOrganizations } from './permissions/usePermissionsForOrganizations';
import {
  computeClusterCountersForOrganizations,
  fetchClusterListForOrganizations,
  fetchClusterListForOrganizationsKey,
} from './utils';

const OrganizationIndex: React.FC = () => {
  const dispatch = useDispatch<IAsynchronousDispatch<IState>>();
  const organizations = useSelector(selectOrganizations());

  const provider = window.config.info.general.provider;

  const clientFactory = useHttpClientFactory();
  const auth = useAuthProvider();
  const { cache } = useSWRConfig();

  const { data: clusterList, error: clusterListError } = useSWR<
    ClusterList,
    GenericResponseError
  >(fetchClusterListForOrganizationsKey(organizations), () =>
    fetchClusterListForOrganizations(
      clientFactory,
      auth,
      cache,
      provider,
      organizations
    )
  );

  useEffect(() => {
    if (clusterListError) {
      new FlashMessage(
        'There was a problem loading clusters.',
        messageType.ERROR,
        messageTTL.FOREVER,
        extractErrorMessage(clusterListError)
      );

      ErrorReporter.getInstance().notify(clusterListError);
    }
  }, [clusterListError]);

  const organizationList = useMemo(() => {
    const clusterCounters = computeClusterCountersForOrganizations(
      clusterList?.items
    );

    const sortedOrganizations = Object.values(organizations).sort((a, b) =>
      (a?.name || a.id).localeCompare(b?.name || b.id)
    );

    const orgs = sortedOrganizations.map((org) => {
      // eslint-disable-next-line @typescript-eslint/init-declarations
      let clusterCount: number | undefined;
      if (clusterListError) {
        clusterCount = -1;
      } else if (clusterCounters) {
        clusterCount = clusterCounters[org.name!] ?? 0;
      }

      return {
        name: org.id,
        clusterCount,
      };
    });

    return orgs;
  }, [organizations, clusterList, clusterListError]);

  const handleOrgClick = (name: string) => {
    const orgPath = RoutePath.createUsablePath(OrganizationsRoutes.Detail, {
      orgId: name,
    });

    dispatch(push(orgPath));
  };

  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  const handleOpenCreateForm = () => {
    setIsCreateFormOpen(true);
  };

  const handleCloseCreateForm = () => {
    setIsCreateFormOpen(false);
  };

  const { canCreate: canCreateOrganizations } = usePermissionsForOrganizations(
    provider,
    'default'
  );

  const orgPermissionsIsLoading = typeof canCreateOrganizations === 'undefined';

  return (
    <DocumentTitle title='Organizations'>
      <OrganizationListPage
        organizations={organizationList}
        onClickRow={handleOrgClick}
      />

      <Box margin={{ top: 'large' }}>
        <OrganizationListCreateOrg
          open={isCreateFormOpen}
          onSubmit={handleCloseCreateForm}
          onCancel={handleCloseCreateForm}
          canCreateOrganizations={canCreateOrganizations}
        />

        {!isCreateFormOpen && (
          <Box
            animation={{ type: 'fadeIn', duration: 300 }}
            direction='row'
            align='center'
          >
            <Button
              onClick={handleOpenCreateForm}
              unauthorized={!canCreateOrganizations}
            >
              <i
                className='fa fa-add-circle'
                role='presentation'
                aria-hidden={true}
              />{' '}
              Add organization
            </Button>
            {!orgPermissionsIsLoading && !canCreateOrganizations && (
              <Text margin={{ left: 'small' }} color='text-weak'>
                For creating an organization, you need additional permissions.
                Please talk to your administrator.
              </Text>
            )}
          </Box>
        )}
      </Box>

      <Box margin={{ top: 'large' }} direction='column' gap='small'>
        <ListOrganizationsGuide />
        <CreateOrganizationGuide
          canCreateOrganizations={canCreateOrganizations}
        />
      </Box>
    </DocumentTitle>
  );
};

export default OrganizationIndex;
