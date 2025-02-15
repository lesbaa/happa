import { Constants } from 'model/constants';
import { AppsRoutes } from 'model/constants/routes';
import {
  installLatestIngress,
  prepareIngressTabData,
} from 'model/stores/appcatalog/actions';
import {
  selectIngressAppFromCluster,
  selectIngressAppToInstall,
} from 'model/stores/appcatalog/selectors';
import { IAsynchronousDispatch } from 'model/stores/asynchronousAction';
import { selectIsClusterAwaitingUpgrade } from 'model/stores/cluster/selectors';
import {
  isClusterCreating,
  isClusterUpdating,
} from 'model/stores/cluster/utils';
import { selectLoadingFlagByAction } from 'model/stores/loading/selectors';
import { IState } from 'model/stores/state';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import Button from 'UI/Controls/Button';
import ClusterIDLabel from 'UI/Display/Cluster/ClusterIDLabel';
import ErrorReporter from 'utils/errors/ErrorReporter';
import RoutePath from 'utils/routePath';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.darkBlueLighter1};
  border-radius: ${({ theme }) => theme.border_radius};
  padding: ${({ theme }) => theme.spacingPx * 5}px;
  height: 90px;
`;

const Text = styled.span`
  margin-left: ${({ theme }) => theme.spacingPx * 2}px;
`;

const StyledLink = styled(Link)`
  text-decoration: underline;
`;

interface IInstallIngressButtonProps
  extends React.ComponentPropsWithoutRef<'div'> {
  cluster: Cluster;
}

const InstallIngressButton: React.FC<IInstallIngressButtonProps> = ({
  cluster,
  ...rest
}) => {
  const [isNew, setIsNew] = useState(true);

  const isInstalling = useSelector<IState, boolean | null>((state) =>
    selectLoadingFlagByAction(state, installLatestIngress().types.request)
  );
  const isPreparingIngressTabData = useSelector<IState, boolean | null>(
    (state) =>
      selectLoadingFlagByAction(state, prepareIngressTabData().types.request)
  );

  const installedIngressApp = selectIngressAppFromCluster(cluster);
  const ingressAppToInstall = useSelector(selectIngressAppToInstall);

  const ingressAppDetailPath = useMemo(() => {
    if (ingressAppToInstall) {
      const { name, version } = ingressAppToInstall;

      return RoutePath.createUsablePath(AppsRoutes.AppDetail, {
        catalogName: Constants.INSTALL_INGRESS_TAB_APP_CATALOG_NAME,
        app: name,
        version,
      });
    }

    return '';
  }, [ingressAppToInstall]);

  const isLoading =
    isNew === true ||
    isPreparingIngressTabData === true ||
    isInstalling === true ||
    !ingressAppToInstall?.version;

  const clusterId: string = cluster.id;

  const dispatch: IAsynchronousDispatch<IState> = useDispatch();

  useEffect(() => {
    const prepare = async () => {
      try {
        await dispatch(prepareIngressTabData({ clusterId }));
        setIsNew(false);
      } catch (err) {
        ErrorReporter.getInstance().notify(err as Error);
      }
    };

    prepare();
  }, [dispatch, clusterId]);

  const installIngressController = async () => {
    try {
      await dispatch(installLatestIngress({ clusterId }));
    } catch (err) {
      ErrorReporter.getInstance().notify(err as Error);
    }
  };

  const clusterIsCreating = isClusterCreating(cluster);
  const clusterIsUpdating =
    useSelector(selectIsClusterAwaitingUpgrade(clusterId)) ||
    isClusterUpdating(cluster);
  const clusterIsNotReady = clusterIsCreating || clusterIsUpdating;

  const additionalText = useMemo(() => {
    if (installedIngressApp) {
      return '🎉 Ingress controller installed. Please continue to the next step.';
    }

    if (ingressAppToInstall) {
      return (
        <>
          This will install the{' '}
          <StyledLink to={ingressAppDetailPath} href={ingressAppDetailPath}>
            NGINX Ingress Controller app {ingressAppToInstall.version}
          </StyledLink>{' '}
          on cluster <ClusterIDLabel clusterID={clusterId} />
          {clusterIsNotReady && (
            <>
              {' '}
              once cluster {clusterIsCreating ? 'creation' : 'upgrade'} has
              finished
            </>
          )}
        </>
      );
    }

    return '';
  }, [
    installedIngressApp,
    clusterIsNotReady,
    ingressAppToInstall,
    ingressAppDetailPath,
    clusterId,
    clusterIsCreating,
  ]);

  return (
    <Wrapper {...rest}>
      {!installedIngressApp && (
        <Button
          loading={isLoading}
          primary={true}
          loadingTimeout={0}
          onClick={installIngressController}
        >
          Install ingress controller
        </Button>
      )}

      {!isLoading && <Text>{additionalText}</Text>}
    </Wrapper>
  );
};

export default InstallIngressButton;
