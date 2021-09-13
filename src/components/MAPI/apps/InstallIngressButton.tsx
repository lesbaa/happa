import { useAuthProvider } from 'Auth/MAPI/MapiAuthProvider';
import { Box, Text } from 'grommet';
import ErrorReporter from 'lib/errors/ErrorReporter';
import { FlashMessage, messageTTL, messageType } from 'lib/flashMessage';
import { useHttpClientFactory } from 'lib/hooks/useHttpClientFactory';
import RoutePath from 'lib/routePath';
import { extractErrorMessage } from 'MAPI/utils';
import { GenericResponseError } from 'model/clients/GenericResponseError';
import * as applicationv1alpha1 from 'model/services/mapi/applicationv1alpha1';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppsRoutes } from 'shared/constants/routes';
import styled from 'styled-components';
import { FlashMessageType } from 'styles';
import useSWR from 'swr';
import Button from 'UI/Controls/Button';
import ClusterIDLabel from 'UI/Display/Cluster/ClusterIDLabel';
import FlashMessageComponent from 'UI/Display/FlashMessage';

import {
  createIngressApp,
  findIngressApp,
  getIngressAppCatalogEntry,
  getIngressAppCatalogEntryKey,
} from './utils';

const StyledFlashMessageComponent = styled(FlashMessageComponent)`
  flex: 1 1 0;
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.darkBlueLighter1};
  border-radius: ${({ theme }) => theme.border_radius};
  padding: ${({ theme }) => theme.spacingPx * 5}px;
  height: 90px;
`;

const StyledLink = styled(Link)`
  text-decoration: underline;
`;

interface IInstallIngressButtonProps
  extends React.ComponentPropsWithoutRef<'div'> {
  clusterID: string;
}

const InstallIngressButton: React.FC<IInstallIngressButtonProps> = ({
  clusterID,
}) => {
  const clientFactory = useHttpClientFactory();
  const auth = useAuthProvider();

  const appListClient = useRef(clientFactory());
  const appListGetOptions = { namespace: clusterID };
  const {
    data: appList,
    isValidating: appListIsValidating,
    error: appListError,
    mutate: mutateAppList,
  } = useSWR<applicationv1alpha1.IAppList, GenericResponseError>(
    applicationv1alpha1.getAppListKey(appListGetOptions),
    () =>
      applicationv1alpha1.getAppList(
        appListClient.current,
        auth,
        appListGetOptions
      )
  );

  useEffect(() => {
    if (appListError) {
      ErrorReporter.getInstance().notify(appListError);
    }
  }, [appListError]);

  const installedIngressApp = useMemo(
    () => findIngressApp(appList?.items),
    [appList?.items]
  );

  const appCatalogEntryClient = useRef(clientFactory());
  const {
    data: ingressAppToInstall,
    error: ingressAppToInstallError,
    isValidating: ingressAppToInstallIsValidating,
  } = useSWR<applicationv1alpha1.IAppCatalogEntry | null, GenericResponseError>(
    getIngressAppCatalogEntryKey(appList?.items),
    () => getIngressAppCatalogEntry(appCatalogEntryClient.current, auth)
  );

  useEffect(() => {
    if (ingressAppToInstallError) {
      ErrorReporter.getInstance().notify(ingressAppToInstallError);
    }
  }, [ingressAppToInstallError]);

  const errorMessage = useMemo(() => {
    if (appListError) {
      return extractErrorMessage(appListError);
    }

    if (ingressAppToInstallError) {
      return extractErrorMessage(ingressAppToInstallError);
    }

    return '';
  }, [appListError, ingressAppToInstallError]);

  const [isInstalling, setIsInstalling] = useState(false);

  let isLoading = false;
  switch (true) {
    case !errorMessage && isInstalling:
      isLoading = true;
      break;
    case !errorMessage && typeof appList === 'undefined' && appListIsValidating:
      isLoading = true;
      break;
    case !errorMessage &&
      typeof ingressAppToInstall === 'undefined' &&
      ingressAppToInstallIsValidating:
      isLoading = true;
      break;
  }

  const handleClick = async () => {
    if (!ingressAppToInstall) return Promise.resolve();

    try {
      setIsInstalling(true);

      await createIngressApp(
        clientFactory,
        auth,
        clusterID,
        ingressAppToInstall
      );

      mutateAppList();

      setIsInstalling(false);
    } catch (err) {
      const message = extractErrorMessage(err);

      new FlashMessage(
        'Something went wrong while trying to install the ingress controller app.',
        messageType.ERROR,
        messageTTL.LONG,
        message
      );

      setIsInstalling(false);

      ErrorReporter.getInstance().notify(err as Error);
    }

    return Promise.resolve();
  };

  const appDetailPath = useMemo(() => {
    if (installedIngressApp) {
      return RoutePath.createUsablePath(AppsRoutes.AppDetail, {
        catalogName: installedIngressApp.spec.catalog,
        app: installedIngressApp.spec.name,
        version: installedIngressApp.spec.version,
      });
    } else if (ingressAppToInstall) {
      return RoutePath.createUsablePath(AppsRoutes.AppDetail, {
        catalogName: ingressAppToInstall.spec.catalog.name,
        app: ingressAppToInstall.spec.appName,
        version: ingressAppToInstall.spec.version,
      });
    }

    return '';
  }, [installedIngressApp, ingressAppToInstall]);

  const installationIsDisabled = Boolean(errorMessage) || !ingressAppToInstall;

  return (
    <Wrapper>
      {!installedIngressApp && (
        <Button
          loading={isLoading}
          primary={true}
          loadingTimeout={0}
          disabled={installationIsDisabled}
          onClick={handleClick}
        >
          Install ingress controller
        </Button>
      )}

      {errorMessage && (
        <StyledFlashMessageComponent type={FlashMessageType.Danger}>
          <Box>
            <Text weight='bold'>
              There was a problem fetching apps in the cluster&apos;s namespace.
            </Text>
            <Text>{errorMessage}</Text>
          </Box>
        </StyledFlashMessageComponent>
      )}

      {!errorMessage && installedIngressApp && (
        <Text>🎉 Ingress controller installed.</Text>
      )}

      {!errorMessage && ingressAppToInstall && (
        <Text margin={{ left: 'small' }}>
          This will install the{' '}
          <StyledLink to={appDetailPath} href={appDetailPath}>
            NGINX Ingress Controller app {ingressAppToInstall.spec.version}
          </StyledLink>{' '}
          on cluster <ClusterIDLabel clusterID={clusterID} />
        </Text>
      )}
    </Wrapper>
  );
};

export default InstallIngressButton;
