import { useAuthProvider } from 'Auth/MAPI/MapiAuthProvider';
import { push, replace } from 'connected-react-router';
import { Box } from 'grommet';
import AppInstallModal from 'MAPI/apps/AppInstallModal';
import { extractErrorMessage } from 'MAPI/utils';
import { GenericResponseError } from 'model/clients/GenericResponseError';
import { AppsRoutes } from 'model/constants/routes';
import * as applicationv1alpha1 from 'model/services/mapi/applicationv1alpha1';
import { getAppCatalogEntryReadmeURL } from 'model/services/mapi/applicationv1alpha1';
import { selectOrganizations } from 'model/stores/organization/selectors';
import { IState } from 'model/stores/state';
import React, { useEffect, useMemo, useRef } from 'react';
import { Breadcrumb } from 'react-breadcrumbs';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';
import DocumentTitle from 'shared/DocumentTitle';
import useSWR, { useSWRConfig } from 'swr';
import { IVersion } from 'UI/Controls/VersionPicker/VersionPickerUtils';
import AppDetailPage from 'UI/Display/Apps/AppDetailNew/AppDetailPage';
import ErrorReporter from 'utils/errors/ErrorReporter';
import { FlashMessage, messageTTL, messageType } from 'utils/flashMessage';
import { useHttpClientFactory } from 'utils/hooks/useHttpClientFactory';
import RoutePath from 'utils/routePath';
import { compare } from 'utils/semver';

import InspectAppGuide from '../guides/InspectAppGuide';
import InstallAppGuide from '../guides/InstallAppGuide';
import { usePermissionsForAppCatalogEntries } from '../permissions/usePermissionsForAppCatalogEntries';
import { usePermissionsForApps } from '../permissions/usePermissionsForApps';
import { usePermissionsForCatalogs } from '../permissions/usePermissionsForCatalogs';
import {
  fetchAppCatalogEntryListForOrganizations,
  fetchAppCatalogEntryListForOrganizationsKey,
  isTestRelease,
} from '../utils';
import {
  fetchAppCatalogEntryReadme,
  fetchAppCatalogEntryReadmeKey,
} from './utils';

function mapAppCatalogEntriesToReleasePickerItems(
  appCatalogEntries?: applicationv1alpha1.IAppCatalogEntry[]
): IVersion[] | undefined {
  if (!appCatalogEntries) return undefined;

  return appCatalogEntries
    .map((e) => ({
      chartVersion: e.spec.version,
      created: e.spec.dateCreated!,
      includesVersion: e.spec.appVersion,
      test: isTestRelease(e.spec.version),
    }))
    .sort((a, b) => compare(b.chartVersion, a.chartVersion));
}

function formatVersion(version: string): string {
  return version.replace(/^v/, '');
}

// eslint-disable-next-line complexity
const AppDetail: React.FC<{}> = () => {
  const match = useRouteMatch<{
    catalogName: string;
    app: string;
    version: string;
  }>();
  const { catalogName, app, version } = match.params;

  const provider = window.config.info.general.provider;

  const clientFactory = useHttpClientFactory();
  const auth = useAuthProvider();

  const { cache } = useSWRConfig();
  const dispatch = useDispatch();

  const appCatalogEntriesPermissions = usePermissionsForAppCatalogEntries(
    provider,
    'default'
  );

  const appCatalogEntryGetOptions: applicationv1alpha1.IGetAppCatalogEntryListOptions =
    useMemo(
      () => ({
        labelSelector: {
          matchingLabels: {
            [applicationv1alpha1.labelAppName]: app,
            [applicationv1alpha1.labelAppCatalog]: catalogName,
          },
        },
      }),
      [app, catalogName]
    );
  const appCatalogEntryListKey = appCatalogEntriesPermissions.canList
    ? fetchAppCatalogEntryListForOrganizationsKey({}, appCatalogEntryGetOptions)
    : null;

  const { data: appCatalogEntryList, error: appCatalogEntryListError } = useSWR<
    applicationv1alpha1.IAppCatalogEntryList,
    GenericResponseError
  >(appCatalogEntryListKey, () =>
    fetchAppCatalogEntryListForOrganizations(
      clientFactory,
      auth,
      cache,
      {},
      appCatalogEntryGetOptions
    )
  );

  useEffect(() => {
    if (appCatalogEntryListError) {
      const errorMessage = extractErrorMessage(appCatalogEntryListError);

      new FlashMessage(
        'There was a problem loading the app versions.',
        messageType.ERROR,
        messageTTL.FOREVER,
        errorMessage
      );

      ErrorReporter.getInstance().notify(appCatalogEntryListError);

      dispatch(push(AppsRoutes.Home));
    }
  }, [appCatalogEntryListError, dispatch]);

  const selectedClusterID = useSelector(
    (state: IState) => state.main.selectedClusterID
  );

  const selectVersion = (v: string) => {
    if (v.length < 1) return;

    const path = RoutePath.createUsablePath(AppsRoutes.AppDetail, {
      catalogName,
      app,
      version: v,
    });

    dispatch(replace(path));
  };

  const otherEntries = useMemo(
    () => mapAppCatalogEntriesToReleasePickerItems(appCatalogEntryList?.items),
    [appCatalogEntryList?.items]
  );

  const selectedEntry = useMemo(
    () => appCatalogEntryList?.items.find((a) => a.spec.version === version),
    [appCatalogEntryList?.items, version]
  );

  useEffect(() => {
    if (appCatalogEntryList && !selectedEntry) {
      new FlashMessage(
        (
          <>
            Couldn&apos;t find version <code>{version}</code> for{' '}
            <code>{app}</code>
          </>
        ),
        messageType.ERROR,
        messageTTL.FOREVER
      );

      dispatch(push(AppsRoutes.Home));
    }
  }, [appCatalogEntryList, selectedEntry, dispatch, version, app]);

  const appReadmeClient = useRef(clientFactory());
  const readmeURL = selectedEntry
    ? getAppCatalogEntryReadmeURL(selectedEntry)
    : undefined;

  const { data: appReadme, error: appReadmeError } = useSWR<
    string,
    GenericResponseError
  >(fetchAppCatalogEntryReadmeKey(readmeURL), () =>
    fetchAppCatalogEntryReadme(appReadmeClient.current, auth, readmeURL!)
  );

  useEffect(() => {
    if (appReadmeError) {
      ErrorReporter.getInstance().notify(appReadmeError);
    }
  }, [appReadmeError]);

  const appName = selectedEntry?.spec.appName;
  let creationDate = selectedEntry?.spec.dateCreated;
  if (creationDate === null) {
    creationDate = '';
  }

  const keywords = useMemo(() => {
    if (!selectedEntry) return undefined;

    return selectedEntry.spec.chart.keywords ?? [];
  }, [selectedEntry]);

  const catalogClient = useRef(clientFactory());

  const catalogPermissions = usePermissionsForCatalogs(
    provider,
    selectedEntry?.spec.catalog.namespace ?? ''
  );

  const catalogKey =
    selectedEntry && catalogPermissions.canGet
      ? applicationv1alpha1.getCatalogKey(
          selectedEntry.spec.catalog.namespace,
          catalogName
        )
      : null;

  const { data: catalog, error: catalogError } = useSWR<
    applicationv1alpha1.ICatalog,
    GenericResponseError
  >(catalogKey, () =>
    applicationv1alpha1.getCatalog(
      catalogClient.current,
      auth,
      selectedEntry!.spec.catalog.namespace,
      catalogName
    )
  );

  useEffect(() => {
    if (catalogError) {
      const errorMessage = extractErrorMessage(catalogError);

      new FlashMessage(
        `There was a problem loading the app's catalog.`,
        messageType.ERROR,
        messageTTL.FOREVER,
        errorMessage
      );

      ErrorReporter.getInstance().notify(catalogError);

      dispatch(push(AppsRoutes.Home));
    }
  }, [catalogError, dispatch]);

  const catalogIcon = catalog ? catalog.spec.logoURL ?? '' : undefined;

  const appIconURL = selectedEntry
    ? selectedEntry.spec.chart.icon ?? ''
    : undefined;
  const chartDescription = selectedEntry
    ? selectedEntry.spec.chart.description ?? ''
    : undefined;
  const chartWebsite = selectedEntry
    ? selectedEntry.spec.chart.home ?? ''
    : undefined;

  const chartVersion = selectedEntry
    ? formatVersion(selectedEntry.spec.version)
    : undefined;
  const appVersion = selectedEntry
    ? formatVersion(selectedEntry.spec.appVersion)
    : undefined;

  const selectedOrgName = useSelector(
    (state: IState) => state.main.selectedOrganization
  );
  const organizations = useSelector(selectOrganizations());
  const selectedOrg = selectedOrgName
    ? organizations[selectedOrgName]
    : undefined;

  const appsPermissions = usePermissionsForApps(
    provider,
    selectedClusterID ?? selectedOrg?.namespace ?? ''
  );

  return (
    <DocumentTitle title={appName ? `App Details | ${appName}` : 'App Details'}>
      <Breadcrumb
        data={{
          title: appName?.toUpperCase() ?? 'Loading…',
          pathname: match.url,
        }}
      >
        <>
          <AppDetailPage
            catalogName={catalog?.spec.title}
            catalogIcon={catalogIcon}
            catalogDescription={catalog?.spec.description}
            otherVersions={otherEntries}
            appTitle={appName}
            appIconURL={appIconURL}
            chartVersion={chartVersion}
            createDate={creationDate}
            includesVersion={appVersion}
            description={chartDescription}
            website={chartWebsite}
            keywords={keywords}
            readmeURL={readmeURL}
            readmeError={extractErrorMessage(appReadmeError)}
            readme={appReadme}
            selectVersion={selectVersion}
            installAppModal={
              selectedEntry && otherEntries && catalog ? (
                <AppInstallModal
                  appName={appName!}
                  chartName={appName!}
                  catalogName={catalog.metadata.name}
                  versions={otherEntries}
                  selectedClusterID={selectedClusterID}
                  appsPermissions={appsPermissions}
                />
              ) : undefined
            }
          />
          {selectedEntry && (
            <Box margin={{ top: 'medium' }} direction='column' gap='small'>
              <InspectAppGuide
                appName={selectedEntry.spec.appName}
                catalogName={selectedEntry.spec.catalog.name}
                catalogNamespace={
                  selectedEntry.spec.catalog.namespace === 'default'
                    ? undefined
                    : selectedEntry.spec.catalog.namespace
                }
                selectedVersion={selectedEntry.spec.version}
              />
              <InstallAppGuide
                appName={selectedEntry.spec.appName}
                catalogName={selectedEntry.spec.catalog.name}
                selectedVersion={selectedEntry.spec.version}
                canInstallApps={
                  appsPermissions.canCreate && appsPermissions.canConfigure
                }
              />
            </Box>
          )}
        </>
      </Breadcrumb>
    </DocumentTitle>
  );
};

export default AppDetail;
