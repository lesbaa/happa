import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import {
  selectResourcesV4,
  selectResourcesV5,
} from 'selectors/clusterSelectors';
import { FallbackMessages } from 'shared/constants';
import { Dot } from 'styles';
import RefreshableLabel from 'UI/RefreshableLabel';

import ClusterDashboardLoadingPlaceholder from './ClusterDashboardLoadingPlaceholder';

const ClusterDetailsDiv = styled.div`
  height: 27px;
  img {
    height: 22px;
  }
`;

const FallbackSpan = styled.span`
  opacity: 0.5;
`;

function ClusterDashboardResources({
  cluster,
  loadingClusters,
  loadingNodePools,
  loadingStatus,
  isV5Cluster,
  resources,
}) {
  const { memory, storage, cores, numberOfNodes } = resources;
  const hasNodePools = cluster.nodePools && cluster.nodePools.length !== 0;
  const loading =
    loadingClusters || loadingStatus || (isV5Cluster && loadingNodePools);

  return (
    <ClusterDetailsDiv>
      {loading ? (
        <ClusterDashboardLoadingPlaceholder isV5Cluster={isV5Cluster} />
      ) : (
        <div>
          {numberOfNodes !== 0 && hasNodePools && (
            <RefreshableLabel value={numberOfNodes}>
              <span>{cluster.nodePools.length} node pools, </span>
            </RefreshableLabel>
          )}
          <RefreshableLabel value={numberOfNodes}>
            {numberOfNodes === 0 ? (
              <FallbackSpan>{FallbackMessages.NODES_NOT_READY}</FallbackSpan>
            ) : (
              <span>{`${numberOfNodes} ${
                numberOfNodes === 1 ? 'node' : 'nodes'
              }`}</span>
            )}
          </RefreshableLabel>
          {numberOfNodes !== 0 && hasNodePools && (
            <>
              <Dot style={{ paddingLeft: 0 }} />
              <RefreshableLabel value={cores}>
                <span>{cores ? cores : '0'} CPU cores</span>
              </RefreshableLabel>
              <Dot style={{ paddingLeft: 0 }} />
              <RefreshableLabel value={memory}>
                <span>{memory ? memory : '0'} GB RAM</span>
              </RefreshableLabel>
            </>
          )}
          {cluster.kvm && (
            <span>
              <Dot style={{ paddingLeft: 0 }} />
              <RefreshableLabel value={storage}>
                <span>{storage ? storage : '0'} GB storage</span>
              </RefreshableLabel>
            </span>
          )}
        </div>
      )}
    </ClusterDetailsDiv>
  );
}

ClusterDashboardResources.propTypes = {
  cluster: PropTypes.object,
  isV5Cluster: PropTypes.bool,
  nodePools: PropTypes.array,
  resources: PropTypes.object,
  loadingClusters: PropTypes.bool,
  loadingNodePools: PropTypes.bool,
  loadingStatus: PropTypes.bool,
};

const makeMapStateToProps = () => {
  const resourcesV4 = selectResourcesV4();
  const resourcesV5 = selectResourcesV5();
  const mapStateToProps = (state, props) => {
    return {
      resources: props.isV5Cluster
        ? resourcesV5(state, props)
        : resourcesV4(state, props),
      loadingClusters: state.loadingFlags.CLUSTERS_DETAILS,
      loadingNodePools: state.loadingFlags.NODEPOOLS_LOAD,
      loadingStatus: state.loadingFlags.CLUSTER_LOAD_STATUS,
    };
  };

  return mapStateToProps;
};

export default connect(
  makeMapStateToProps,
  undefined
)(ClusterDashboardResources);
