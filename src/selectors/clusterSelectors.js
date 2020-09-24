import cmp from 'semver-compare';
import { Constants } from 'shared/constants';
import { getUserIsAdmin } from 'stores/user/selectors';
import {
  canClusterUpgrade,
  getCpusTotal,
  getMemoryTotal,
  getNumberOfNodes,
  getStorageTotal,
  isClusterCreating,
  isClusterUpdating,
} from 'utils/clusterUtils';

import { createDeepEqualSelector, typeWithoutSuffix } from './selectorUtils';

// Regular selectors
export const selectClusterById = (state, id) => {
  return state.entities.clusters.items[id];
};

export const selectIngressAppFromCluster = (cluster) => {
  const apps = cluster.apps || [];

  const ingressApp = apps.find((app) => {
    return app.spec.name === Constants.INSTALL_INGRESS_TAB_APP_NAME;
  });

  return ingressApp;
};

const selectOrganizationClusterNames = (state) => {
  const clusters = state.entities.clusters.items;
  const clusterIds = Object.keys(clusters);

  return clusterIds
    .filter((id) => clusters[id].owner === state.main.selectedOrganization)
    .sort((a, b) => (clusters[a].name > clusters[b].name ? 1 : -1));
};

export const selectErrorByIdAndAction = (state, id, actionType) => {
  return state.errorsByEntity[id]?.[typeWithoutSuffix(actionType)] ?? null;
};

export const selectLoadingFlagByIdAndAction = (state, id, actionType) => {
  return (
    state.loadingFlagsByEntity[id]?.[typeWithoutSuffix(actionType)] ?? true
  );
};

export const selectLoadingFlagByAction = (state, actionType) => {
  return state.loadingFlags[typeWithoutSuffix(actionType)] ?? null;
};

// Memoized Reselect selectors
// https://github.com/reduxjs/reselect#createselectorinputselectors--inputselectors-resultfunc
// Using factory functions because they create new references each time that are called,
// so each cluster can have its dedicated function. More info:
// https://github.com/reduxjs/reselect#sharing-selectors-with-props-across-multiple-component-instances

export const selectClustersList = () => {
  return createDeepEqualSelector(
    selectOrganizationClusterNames,
    (clusters) => clusters
  );
};

export const selectResourcesV4 = () =>
  createDeepEqualSelector(selectClusterById, (cluster) => {
    // In case status call fails.
    if (
      !cluster ||
      !cluster.status ||
      !cluster.status.cluster.nodes ||
      cluster.status.cluster.nodes.length === 0
    ) {
      return { numberOfNodes: 0, memory: 0, cores: 0, storage: 0 };
    }

    const numberOfNodes = getNumberOfNodes(cluster);
    const memory = getMemoryTotal(cluster);
    const cores = getCpusTotal(cluster);
    const storage = getStorageTotal(cluster);

    return { numberOfNodes, memory, cores, storage };
  });

export const selectTargetRelease = (state, cluster) => {
  if (!cluster || Object.keys(state.entities.releases.items).length === 0)
    return null;

  const releases = Object.assign({}, state.entities.releases.items);
  const clusterReleaseVersion = cluster.release_version;
  const isAdmin = getUserIsAdmin(state);

  // Guard against the release version of this cluster not being in the /v4/releases/
  // response.
  // This will ensure that Happa can calculate the target version for upgrade
  // correctly.
  if (!releases[clusterReleaseVersion]) {
    releases[clusterReleaseVersion] = null;
  }
  const availableVersions = Object.keys(releases).sort(cmp);

  let nextVersion = null;
  let currVersionFound = false;
  for (let i = 0; i < availableVersions.length; i++) {
    if (availableVersions[i] === clusterReleaseVersion) {
      currVersionFound = true;

      continue;
    }
    if (!currVersionFound) continue;

    if (releases[availableVersions[i]]?.active) {
      nextVersion = availableVersions[i];

      break;
    }

    if (isAdmin && !nextVersion) {
      nextVersion = availableVersions[i];
    }
  }

  return nextVersion;
};

export const selectCanClusterUpgrade = (clusterID) => (state) => {
  const cluster = state.entities.clusters.items[clusterID];
  if (!cluster) return false;

  if (isClusterCreating(cluster) || isClusterUpdating(cluster)) {
    return false;
  }

  const targetVersion = selectTargetRelease(state, cluster);

  return canClusterUpgrade(
    cluster.release_version,
    targetVersion,
    state.main.info.general.provider
  );
};

export const selectIsClusterUpgrading = (clusterID) => (state) => {
  const cluster = state.entities.clusters.items[clusterID];
  if (!cluster) return false;

  return isClusterUpdating(cluster);
};
