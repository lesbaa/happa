import GiantSwarm from 'giantswarm';
import { FlashMessage, messageTTL, messageType } from 'lib/flashMessage';
import moment from 'moment';
import { StatusCodes } from 'shared/constants';
import { computeCapabilities, filterLabels } from 'utils/clusterUtils';

import * as types from './actionTypes';

// Used in ClusterDetailView
export const clusterDelete = (cluster) => ({
  type: types.CLUSTER_DELETE_REQUEST,
  cluster,
});

// API instantiations.
const clustersApi = new GiantSwarm.ClustersApi();

// This is a helper function that transforms an array of clusters into an object
// of clusters with its ids as keys. Also we add some data to the clusters objects.
function clustersLoadArrayToObject(clusters, provider) {
  return clusters
    .map((cluster) => {
      return {
        ...cluster,
        lastUpdated: Date.now(),
        nodes: cluster.nodes || [],
        keyPairs: cluster.keyPairs || [],
        scaling: cluster.scaling || {},
        // Since we only load cluster details for clusters that are in the
        // currently selected org, we also need to computeCapabilities here.
        // The install app modal lists all clusters and needs to know the capabiltiies.
        capabilities: computeCapabilities(cluster.release_version, provider),
        labels: filterLabels(cluster.labels),
      };
    })
    .reduce((accumulator, current) => {
      return { ...accumulator, [current.id]: current };
    }, {});
}

/**
 * Performs the getClusters API call and dispatches related actions
 * This is just for getting all the clusters, but not their details.
 * @param {Boolean} withLoadingFlags Set to false to avoid loading state (eg when refreshing)
 */
export function clustersList({ withLoadingFlags }) {
  return function (dispatch, getState) {
    if (withLoadingFlags) dispatch({ type: types.CLUSTERS_LIST_REQUEST });

    const provider = getState().main.info.general.provider;

    // Fetch all clusters.
    return clustersApi
      .getClusters()
      .then((data) => {
        const clusters = clustersLoadArrayToObject(data, provider);

        const allIds = data.map((cluster) => cluster.id);

        const v5ClusterIds = data
          .filter((cluster) => cluster.path.startsWith('/v5'))
          .map((cluster) => cluster.id);

        dispatch({
          type: types.CLUSTERS_LIST_SUCCESS,
          clusters,
          v5ClusterIds,
          allIds,
        });
      })
      .catch((error) => {
        dispatch({
          type: types.CLUSTERS_LIST_ERROR,
          error: error.message,
        });
      });
  };
}

/**
 * Let's fetch the clusters list without overwriting the existent list
 */
export function refreshClustersList() {
  return function (dispatch, getState) {
    dispatch({ type: types.CLUSTERS_LIST_REFRESH_REQUEST });

    const provider = getState().main.info.general.provider;
    const clusterStoredIds = Object.keys(getState().entities.clusters.items);

    // Fetch all clusters.
    clustersApi
      .getClusters()
      .then((data) => {
        // Compare clusters.
        const addedClusters = data.filter(
          (cluster) => !clusterStoredIds.includes(cluster.id)
        );

        let clusters = {};
        let v5ClusterIds = [];

        // If there are new clusters...
        if (addedClusters.length > 0) {
          clusters = clustersLoadArrayToObject(addedClusters, provider);

          v5ClusterIds = addedClusters
            .filter((cluster) => cluster.path.startsWith('/v5'))
            .map((cluster) => cluster.id);
        }

        // If clusters and v5Clusters are empty, we still want to dispatch this in
        // order to set the loading flag to false.
        dispatch({
          type: types.CLUSTERS_LIST_REFRESH_SUCCESS,
          clusters,
          v5ClusterIds,
        });
      })
      .catch((error) => {
        dispatch({
          type: types.CLUSTERS_LIST_REFRESH_ERROR,
          error: error.message,
        });
      });
  };
}

/**
 * Performs getCluster API call to get the details of all clusters in store
 * @param {Boolean} filterBySelectedOrganization
 */
export function clustersDetails({
  filterBySelectedOrganization,
  withLoadingFlags,
  initializeNodePools,
}) {
  return async function (dispatch, getState) {
    if (withLoadingFlags) {
      dispatch({ type: types.CLUSTERS_DETAILS_REQUEST });
    }

    const selectedOrganization = getState().main.selectedOrganization;
    const allClusters = await getState().entities.clusters.items;

    // Remove deleted clusters from clusters array
    const allActiveClustersIds = Object.keys(allClusters).filter(
      (id) => !allClusters[id].delete_date
    );

    const clustersIds = filterBySelectedOrganization
      ? allActiveClustersIds.filter(
          (id) => allClusters[id].owner === selectedOrganization
        )
      : allActiveClustersIds;

    const clusterDetails = await Promise.all(
      clustersIds.map((id) =>
        dispatch(
          clusterLoadDetails(id, { withLoadingFlags, initializeNodePools })
        )
      )
    );

    // We actually don't care if success or error, just want to set loading flag to
    // false when all the promises are resolved/rejected.
    dispatch({ type: types.CLUSTERS_DETAILS_FINISHED });

    return clusterDetails; // just in case we want to await it
  };
}

/**
 * Loads details for a cluster.
 * @param {String} clusterId Cluster ID
 */
export function clusterLoadDetails(
  clusterId,
  { withLoadingFlags, initializeNodePools }
) {
  return async function (dispatch, getState) {
    const v5Clusters = getState().entities.clusters.v5Clusters;
    const isV5Cluster = v5Clusters.includes(clusterId);

    if (withLoadingFlags) {
      dispatch({
        type: types.CLUSTER_LOAD_DETAILS_REQUEST,
        id: clusterId,
      });
    }

    try {
      const cluster = isV5Cluster
        ? await clustersApi.getClusterV5(clusterId)
        : await clustersApi.getCluster(clusterId);

      // We don't want this action to overwrite nodepools except on initialization.
      if (isV5Cluster && initializeNodePools) cluster.nodePools = [];

      const provider = getState().main.info.general.provider;
      cluster.capabilities = computeCapabilities(
        cluster.release_version,
        provider
      );

      // Since the API omits the 'aws' key from workers on kvm installations, I will
      // add it back here with dummy values if it is not present.
      cluster.workers = !cluster.workers
        ? // If no workers, return an empty array.
          []
        : // Otherwise, and if there is no aws key in the worker object, create it.
          cluster.workers.map((worker) => {
            if (!worker.aws) worker.aws = { instance_type: '' };

            return worker;
          });

      // Fill in scaling values when they aren't supplied.
      // Although we had this in the reducer, we were not actually updating the cluster
      // object, so this in kinda of new
      const { scaling, workers } = cluster;
      if (scaling && !scaling.min && !scaling.max) {
        cluster.scaling.min = workers.length;
        cluster.scaling.max = workers.length;
      }

      // Get status if this is a v4 cluster.
      if (!isV5Cluster) {
        cluster.status = await dispatch(
          clusterLoadStatus(clusterId, { withLoadingFlags })
        );
      }

      // Remove cluster's create_date because we are loading it in clustersList()
      delete cluster.create_date;

      if (cluster.labels) {
        cluster.labels = filterLabels(cluster.labels);
      }

      dispatch({
        type: types.CLUSTER_LOAD_DETAILS_SUCCESS,
        cluster,
        id: clusterId,
      });

      return cluster;
    } catch (error) {
      if (error.response?.status === StatusCodes.NotFound) {
        new FlashMessage(
          `Cluster <code>${clusterId}</code> no longer exists.`,
          messageType.INFO,
          messageTTL.MEDIUM
        );

        // Delete the cluster in the store.
        dispatch({
          type: types.CLUSTER_REMOVE_FROM_STORE,
          clusterId,
          isV5Cluster,
        });

        return {};
      }

      dispatch({
        type: types.CLUSTER_LOAD_DETAILS_ERROR,
        id: clusterId,
        error,
      });

      let errorMessage = `Something went wrong while trying to load cluster details for <code>${clusterId}</code>.`;
      if (error.response?.message || error.message) {
        errorMessage = `There was a problem loading the cluster details: ${
          error.response?.message ?? error.message
        }`;
      }

      new FlashMessage(
        errorMessage,
        messageType.ERROR,
        messageTTL.LONG,
        'Please try again later or contact support: support@giantswarm.io'
      );

      return {};
    }
  };
}

function clusterLoadStatus(clusterId, { withLoadingFlags }) {
  return function (dispatch) {
    // Does it  makes sense to leave it here just for let loadingReducer set/unset a flag?
    if (withLoadingFlags)
      dispatch({ type: types.CLUSTER_LOAD_STATUS_REQUEST, clusterId });

    return clustersApi
      .getClusterStatusWithHttpInfo(clusterId)
      .then((data) => {
        return JSON.parse(data.response.text);
      })
      .then((status) => {
        dispatch({ type: types.CLUSTER_LOAD_STATUS_SUCCESS, clusterId });

        return status; // used in clusterLoadDetails!
      })
      .catch((error) => {
        // TODO: Find a better way to deal with status endpoint errors in dev:
        // https://github.com/giantswarm/giantswarm/issues/6757

        if (error.status === StatusCodes.NotFound) {
          dispatch({ type: types.CLUSTER_LOAD_STATUS_NOT_FOUND, clusterId });
        } else {
          dispatch({ type: types.CLUSTER_LOAD_STATUS_ERROR, error });

          let errorMessage =
            'Something went wrong while trying to load the cluster status.';
          if (error.response?.message || error.message) {
            errorMessage = `There was a problem loading the cluster status: ${
              error.response?.message ?? error.message
            }`;
          }

          new FlashMessage(
            errorMessage,
            messageType.ERROR,
            messageTTL.LONG,
            'Please try again later or contact support: support@giantswarm.io'
          );
        }
      });
  };
}

/**
 * Takes a cluster object and tries to create it. Dispatches CLUSTER_CREATE_SUCCESS
 * on success or CLUSTER_CREATE_ERROR on error.
 *
 * @param {Object} cluster Cluster definition object
 * @param {Boolean} isV5Cluster
 */
export function clusterCreate(cluster, isV5Cluster) {
  return async function (dispatch) {
    try {
      dispatch({ type: types.CLUSTER_CREATE_REQUEST });

      const data = isV5Cluster
        ? await clustersApi.addClusterV5WithHttpInfo(cluster)
        : await clustersApi.addClusterWithHttpInfo(cluster);

      const location = data.response.headers.location;
      if (typeof location === 'undefined') {
        throw new Error('Did not get a location header back.');
      }

      const clusterIdURLParamIndex = 3;
      const clusterId = location.split('/')[clusterIdURLParamIndex];
      if (typeof clusterId === 'undefined') {
        throw new Error('Did not get a valid cluster id.');
      }

      if (isV5Cluster) {
        dispatch({
          type: types.V5_CLUSTER_CREATE_SUCCESS,
          clusterId,
        });
      } else {
        dispatch({
          type: types.CLUSTER_CREATE_SUCCESS,
          clusterId,
        });
      }

      return { clusterId, owner: cluster.owner };
    } catch (error) {
      dispatch({ type: types.CLUSTER_CREATE_ERROR, error: error.message });

      new FlashMessage(
        'An error occurred when trying to create the cluster.',
        messageType.ERROR,
        messageTTL.LONG,
        'Please try again later or contact support: support@giantswarm.io'
      );
    }

    return null;
  };
}

/**
 * Takes a cluster object and deletes that cluster. Dispatches CLUSTER_DELETE_SUCCESS
 * on success or CLUSTER_DELETE_ERROR on error.
 *
 * @param {Object} cluster Cluster definition object, containing ID and owner
 */
export function clusterDeleteConfirmed(cluster) {
  return function (dispatch) {
    dispatch({
      type: types.CLUSTER_DELETE_CONFIRMED,
      cluster,
    });

    return clustersApi
      .deleteCluster(cluster.id)
      .then((data) => {
        dispatch({
          type: types.CLUSTER_DELETE_SUCCESS,
          clusterId: cluster.id,
          timestamp: Date.now(),
        });

        new FlashMessage(
          `Cluster <code>${cluster.id}</code> will be deleted`,
          messageType.INFO,
          messageTTL.SHORT
        );

        return data;
      })
      .catch((error) => {
        new FlashMessage(
          `An error occurred when trying to delete cluster <code>${cluster.id}</code>.`,
          messageType.ERROR,
          messageTTL.LONG,
          'Please try again later or contact support: support@giantswarm.io'
        );

        return dispatch({
          type: types.CLUSTER_DELETE_ERROR,
          clusterId: cluster.id,
          error,
        });
      });
  };
}

/**
 * Takes a clusterId and loads its key pairs.
 * dispatches CLUSTER_LOAD_KEY_PAIRS_SUCCESS on success or CLUSTER_LOAD_KEY_PAIRS_ERROR
 * on error.
 *
 * @param {String} clusterId Cluster ID
 */
export function clusterLoadKeyPairs(clusterId) {
  return function (dispatch) {
    const keypairsApi = new GiantSwarm.KeyPairsApi();

    dispatch({ type: types.CLUSTER_LOAD_KEY_PAIRS_REQUEST });

    return keypairsApi
      .getKeyPairs(clusterId)
      .then((keyPairs) => {
        // Add expire_date to keyPairs based on ttl_hours
        const keyPairsWithDates = Object.entries(keyPairs).map(
          ([, keyPair]) => {
            keyPair.expire_date = moment(keyPair.create_date)
              .utc()
              .add(keyPair.ttl_hours, 'hours');

            return keyPair;
          }
        );

        dispatch({
          type: types.CLUSTER_LOAD_KEY_PAIRS_SUCCESS,
          clusterId,
          keyPairs: keyPairsWithDates,
        });
      })
      .catch(() => {
        dispatch({
          type: types.CLUSTER_LOAD_KEY_PAIRS_ERROR,
          clusterId,
        });
      });
  };
}

/**
 * Takes a cluster object and tries to patch it.
 * Dispatches CLUSTER_PATCH on patch and CLUSTER_PATCH_ERROR
 * on error.
 *
 * @param {Object} cluster Cluster object
 * @param {Object} payload object with just the data we want to modify
 * @param {boolean} [reloadCluster=false] - Whether it should reload the cluster after it's done patching. Useful for
 * not doing optimistic updates.
 */
export function clusterPatch(cluster, payload, reloadCluster = false) {
  return async function (dispatch, getState) {
    const v5Clusters = getState().entities.clusters.v5Clusters;
    const isV5Cluster = v5Clusters.includes(cluster.id);

    // Optimistic update.
    dispatch({
      type: types.CLUSTER_PATCH,
      cluster,
      payload,
    });

    const modifyCluster = isV5Cluster
      ? clustersApi.modifyClusterV5.bind(clustersApi)
      : clustersApi.modifyCluster.bind(clustersApi);

    try {
      await modifyCluster(cluster.id, payload);

      if (reloadCluster) {
        await dispatch(
          clusterLoadDetails(cluster.id, {
            withLoadingFlags: false,
            initializeNodePools: false,
          })
        );
      }
    } catch (error) {
      // Undo update to store if the API call fails.
      dispatch({
        type: types.CLUSTER_PATCH_ERROR,
        error,
        cluster,
      });

      new FlashMessage(
        'Something went wrong while trying to update the cluster',
        messageType.ERROR,
        messageTTL.MEDIUM,
        'Please try again later or contact support: support@giantswarm.io'
      );

      throw error;
    }
  };
}

/**
 * Creates a keypair for a cluster.
 * Dispatches CLUSTER_CREATE_KEYPAIR_SUCCESS on success or CLUSTER_CREATE_KEYPAIR_ERROR
 * on error.
 *
 * @param {String} clusterId Cluster ID
 * @param {Object} keypair   Key pair object
 */
export function clusterCreateKeyPair(clusterId, keypair) {
  return function (dispatch) {
    dispatch({
      type: types.CLUSTER_CREATE_KEY_PAIR_REQUEST,
      keypair,
    });

    const keypairsApi = new GiantSwarm.KeyPairsApi();

    return keypairsApi
      .addKeyPair(clusterId, keypair)
      .then((pair) => {
        dispatch({
          type: types.CLUSTER_CREATE_KEY_PAIR_SUCCESS,
          pair,
        });

        return pair;
      })
      .catch((error) => {
        dispatch({
          type: types.CLUSTER_CREATE_KEY_PAIR_ERROR,
          error,
        });

        throw error;
      });
  };
}
