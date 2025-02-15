import InstallIngressButton from 'Cluster/ClusterDetail/Ingress/InstallIngressButton';
import InstallIngressButtonMAPI from 'MAPI/apps/InstallIngressButton';
import { OrganizationsRoutes } from 'model/constants/routes';
import { supportsMapiApps } from 'model/featureSupport';
import { selectClusterById } from 'model/stores/cluster/selectors';
import { getLoggedInUser } from 'model/stores/main/selectors';
import React from 'react';
import { Breadcrumb } from 'react-breadcrumbs';
import { connect, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import Button from 'UI/Controls/Button';
import GettingStartedBottomNav from 'UI/Display/Documentation/GettingStartedBottomNav';
import RoutePath from 'utils/routePath';

const InstallIngressButtonWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.spacingPx * 5}px;
`;

const InstallIngress = (props) => {
  const pathParams = {
    orgId: props.match.params.orgId,
    clusterId: props.match.params.clusterId,
  };

  const clusterGuideIngressPath = RoutePath.createUsablePath(
    OrganizationsRoutes.Clusters.GettingStarted.InstallIngress,
    pathParams
  );

  const clusterGuideConfigurationPath = RoutePath.createUsablePath(
    OrganizationsRoutes.Clusters.GettingStarted.ConfigureKubeCtl,
    pathParams
  );

  const clusterGuideExamplePath = RoutePath.createUsablePath(
    OrganizationsRoutes.Clusters.GettingStarted.SimpleExample,
    pathParams
  );

  const user = useSelector(getLoggedInUser);
  const provider = window.config.info.general.provider;

  return (
    <Breadcrumb
      data={{
        title: 'INSTALL INGRESS',
        pathname: clusterGuideIngressPath,
      }}
    >
      <>
        <h1>Install an ingress controller</h1>

        <p>
          Your cluster does not come with an ingress controller installed by
          default. Without an ingress controller you won&apos;t be able to
          access any services running on the cluster from the browser.
        </p>

        <h3>Using the Giant Swarm App Platform</h3>
        <p>
          You can use our app platform to install the popular nginx ingress
          controller. We provide a tuned implementation in the &quot;Giant Swarm
          Catalog&quot;, which you can browse by clicking &quot;App
          Catalogs&quot; in the navigation above.
        </p>

        <p>
          For convenience however, you can click on the &apos;Install Ingress
          Controller&apos; button below to immediately install the nginx ingress
          controller on your cluster.
        </p>

        <InstallIngressButtonWrapper>
          {supportsMapiApps(user, provider) ? (
            <InstallIngressButtonMAPI clusterID={props.cluster.id} />
          ) : (
            <InstallIngressButton cluster={props.cluster} />
          )}
        </InstallIngressButtonWrapper>

        <GettingStartedBottomNav>
          <Link to={clusterGuideConfigurationPath}>
            <Button icon={<i className='fa fa-chevron-left' />}>Back</Button>
          </Link>

          <Link to={clusterGuideExamplePath}>
            <Button
              primary={true}
              icon={<i className='fa fa-chevron-right' />}
              reverse={true}
            >
              Continue
            </Button>
          </Link>
        </GettingStartedBottomNav>
      </>
    </Breadcrumb>
  );
};

function mapStateToProps(state, ownProps) {
  const selectedCluster = selectClusterById(
    state,
    ownProps.match.params.clusterId
  );

  return {
    cluster: selectedCluster,
  };
}

export default connect(mapStateToProps)(InstallIngress);
