'use strict';

import * as types from './actionTypes';
import { FlashMessage, messageTTL, messageType } from '../lib/flash_message';
import { modalHide } from './modalActions';
import { push } from 'connected-react-router';
import APIClusterStatusClient from '../lib/api_status_client';
import GiantSwarmV4 from 'giantswarm-v4';

// clustersLoad
// -----------------
// Performs the getClusters API call and dispatches the clustersLoadSuccess
// action.
//
export function clustersLoad() {
  return function(dispatch, getState) {
    var token = getState().app.loggedInUser.auth.token;
    var scheme = getState().app.loggedInUser.auth.scheme;
    var clustersApi = new GiantSwarmV4.ClustersApi();

    dispatch({ type: types.CLUSTERS_LOAD });

    return clustersApi
      .getClusters(scheme + ' ' + token)
      .then(data => {
        dispatch(clustersLoadSuccess(data));
        return data;
      })
      .catch(error => {
        console.error(error);
        dispatch(clustersLoadError(error));
      });
  };
}

// clusterLoadDetails
// =============================================================
// Takes a clusterId and loads details for that cluster

export function clusterLoadDetails(clusterId) {
  return function(dispatch, getState) {
    var token = getState().app.loggedInUser.auth.token;
    var scheme = getState().app.loggedInUser.auth.scheme;

    dispatch({
      type: types.CLUSTER_LOAD_DETAILS,
      clusterId,
    });

    var cluster;
    var clustersApi = new GiantSwarmV4.ClustersApi();

    return clustersApi
      .getCluster(scheme + ' ' + token, clusterId)
      .then(c => {
        cluster = c;
        return dispatch(clusterLoadStatus(clusterId));
      })
      .then(() => {
        dispatch(clusterLoadDetailsSuccess(cluster));
        return cluster;
      })
      .catch(error => {
        console.error('Error loading cluster details:', error);
        dispatch(clusterLoadDetailsError(clusterId, error));

        new FlashMessage(
          'Something went wrong while trying to load cluster details.',
          messageType.ERROR,
          messageTTL.LONG,
          'Please try again later or contact support: support@giantswarm.io'
        );

        throw error;
      });
  };
}

// clusterLoadStatus
// =============================================================
// Takes a clusterId and loads status for that cluster.

export function clusterLoadStatus(clusterId) {
  return function(dispatch, getState) {
    var token = getState().app.loggedInUser.auth.token;
    var scheme = getState().app.loggedInUser.auth.scheme;

    dispatch({
      type: types.CLUSTER_LOAD_STATUS,
      clusterId,
    });

    var apiClusterStatus = new APIClusterStatusClient({
      endpoint: window.config.apiEndpoint,
    });

    return apiClusterStatus
      .getClusterStatus(scheme + ' ' + token, clusterId)
      .then(status => {
        dispatch(clusterLoadStatusSuccess(clusterId, status));
        return status;
      })
      .catch(error => {
        console.error(error);
        if (error.status === 404) {
          dispatch(clusterLoadStatusNotFound(clusterId));
        } else {
          dispatch(clusterLoadStatusError(clusterId, error));

          new FlashMessage(
            'Something went wrong while trying to load the cluster status.',
            messageType.ERROR,
            messageTTL.LONG,
            'Please try again later or contact support: support@giantswarm.io'
          );

          throw error;
        }
      });
  };
}

// clusterCreate
// ==============================================================
// Takes a cluster object and tries to create it. Dispatches CLUSTER_CREATE_SUCCESS
// on success or CLUSTER_CREATE_ERROR on error.

export function clusterCreate(cluster) {
  return function(dispatch, getState) {
    var token = getState().app.loggedInUser.auth.token;
    var scheme = getState().app.loggedInUser.auth.scheme;

    dispatch({
      type: types.CLUSTER_CREATE,
      cluster,
    });

    var clustersApi = new GiantSwarmV4.ClustersApi();

    return clustersApi
      .addClusterWithHttpInfo(scheme + ' ' + token, cluster)
      .then(data => {
        var location = data.response.headers.location;
        if (location === undefined) {
          throw 'Did not get a location header back.';
        }

        var clusterId = location.split('/')[3];
        if (clusterId === undefined) {
          throw 'Did not get a valid cluster id.';
        }

        dispatch(clusterCreateSuccess(clusterId));

        new FlashMessage(
          'Your new cluster with ID <code>' +
            clusterId +
            '</code> is being created.',
          messageType.SUCCESS,
          messageTTL.MEDIUM
        );

        return dispatch(clusterLoadDetails(clusterId));
      })
      .catch(error => {
        console.error(error);
        dispatch(clusterCreateError(cluster.id, error));
        throw error;
      });
  };
}

// clusterDeleteConfirmed
// ==============================================================
// Takes a cluster object and deletes that cluster. Dispatches CLUSTER_DELETE_SUCCESS
// on success or CLUSTER_DELETE_ERROR on error.
//
// required param:
//  cluster: {id: "string", owner: "string"}

export function clusterDeleteConfirmed(cluster) {
  return function(dispatch, getState) {
    var token = getState().app.loggedInUser.auth.token;
    var scheme = getState().app.loggedInUser.auth.scheme;

    dispatch({
      type: types.CLUSTER_DELETE_CONFIRMED,
      cluster,
    });

    var clustersApi = new GiantSwarmV4.ClustersApi();

    return clustersApi
      .deleteCluster(scheme + ' ' + token, cluster.id)
      .then(() => {
        dispatch(push('/organizations/' + cluster.owner));
        dispatch(clusterDeleteSuccess(cluster.id));

        dispatch(modalHide());

        new FlashMessage(
          'Cluster <code>' + cluster.id + '</code> will be deleted',
          messageType.INFO,
          messageTTL.SHORT
        );
      })
      .catch(error => {
        dispatch(modalHide());

        new FlashMessage(
          'An error occurred when trying to delete cluster <code>' +
            cluster.id +
            '</code>.',
          messageType.ERROR,
          messageTTL.LONG,
          'Please try again later or contact support: support@giantswarm.io'
        );

        console.error(error);
        return dispatch(clusterDeleteError(cluster.id, error));
      });
  };
}

// clusterLoadKeyPairs
// ==============================================================
// Takes a clusterId and loads its key pairs.
// dispatches CLUSTER_LOAD_KEY_PAIRS_SUCCESS on success or CLUSTER_LOAD_KEY_PAIRS_ERROR
// on error.

export function clusterLoadKeyPairs(clusterId) {
  return function(dispatch, getState) {
    var token = getState().app.loggedInUser.auth.token;
    var scheme = getState().app.loggedInUser.auth.scheme;
    var keypairsApi = new GiantSwarmV4.KeyPairsApi();

    dispatch({
      type: types.CLUSTER_LOAD_KEY_PAIRS,
      clusterId,
    });

    return keypairsApi
      .getKeyPairs(scheme + ' ' + token, clusterId)
      .then(keyPairs => {
        dispatch({
          type: types.CLUSTER_LOAD_KEY_PAIRS_SUCCESS,
          clusterId,
          keyPairs: keyPairs,
        });
      })
      .catch(error => {
        dispatch({
          type: types.CLUSTER_LOAD_KEY_PAIRS_ERROR,
          clusterId,
        });

        console.error(error);
        throw error;
      });
  };
}

export function clusterLoadDetailsSuccess(cluster) {
  return {
    type: types.CLUSTER_LOAD_DETAILS_SUCCESS,
    cluster,
  };
}

export function clusterLoadDetailsError(error) {
  return {
    type: types.CLUSTER_LOAD_DETAILS_ERROR,
    error,
  };
}

export function clusterLoadStatusSuccess(clusterId, status) {
  return {
    type: types.CLUSTER_LOAD_STATUS_SUCCESS,
    clusterId,
    status,
  };
}

export function clusterLoadStatusNotFound(clusterId) {
  return {
    type: types.CLUSTER_LOAD_STATUS_NOT_FOUND,
    clusterId,
  };
}

export function clusterLoadStatusError(error) {
  return {
    type: types.CLUSTER_LOAD_STATUS_ERROR,
    error,
  };
}

export function clusterCreateSuccess(cluster) {
  return {
    type: types.CLUSTER_CREATE_SUCCESS,
    cluster,
  };
}

export function clusterCreateError(cluster) {
  return {
    type: types.CLUSTER_CREATE_ERROR,
    cluster,
  };
}

export function clusterDelete(cluster) {
  return {
    type: types.CLUSTER_DELETE,
    cluster,
  };
}

export function clusterDeleteSuccess(clusterId) {
  return {
    type: types.CLUSTER_DELETE_SUCCESS,
    clusterId,
  };
}

export function clusterDeleteError(clusterId, error) {
  return {
    type: types.CLUSTER_DELETE_ERROR,
    clusterId,
    error,
  };
}

export function clustersLoadSuccess(clusters) {
  return {
    type: types.CLUSTERS_LOAD_SUCCESS,
    clusters: clusters,
  };
}

export function clustersLoadError(error) {
  return {
    type: types.CLUSTERS_LOAD_ERROR,
    error: error,
  };
}

// clusterPatch
// ==============================================================
// Takes a cluster object and tries to patch it.
// dispatches CLUSTER_PATCH_SUCCESS on success or CLUSTER_PATCH_ERROR
// on error.

export function clusterPatch(cluster) {
  return function(dispatch, getState) {
    var token = getState().app.loggedInUser.auth.token;
    var scheme = getState().app.loggedInUser.auth.scheme;

    dispatch({
      type: types.CLUSTER_PATCH,
      cluster,
    });

    var clusterId = cluster.id;
    delete cluster.id;

    var clustersApi = new GiantSwarmV4.ClustersApi();
    return clustersApi
      .modifyCluster(scheme + ' ' + token, cluster, clusterId)
      .then(cluster => {
        dispatch({
          type: types.CLUSTER_PATCH_SUCCESS,
          cluster,
        });

        return cluster;
      })
      .catch(error => {
        dispatch({
          type: types.CLUSTER_PATCH_ERROR,
          error,
        });

        console.error(error);
        throw error;
      });
  };
}

// clusterCreateKeyPair
// ==============================================================
// Creates a keypair for a cluster.
// dispatches CLUSTER_CREATE_KEYPAIR_SUCCESS on success or CLUSTER_CREATE_KEYPAIR_ERROR
// on error.

export function clusterCreateKeyPair(clusterId, keypair) {
  return function(dispatch, getState) {
    var token = getState().app.loggedInUser.auth.token;
    var scheme = getState().app.loggedInUser.auth.scheme;

    dispatch({
      type: types.CLUSTER_CREATE_KEY_PAIR,
      keypair,
    });

    var keypairsApi = new GiantSwarmV4.KeyPairsApi();
    return keypairsApi
      .addKeyPair(scheme + ' ' + token, clusterId, keypair)
      .then(keypair => {
        dispatch({
          type: types.CLUSTER_CREATE_KEY_PAIR_SUCCESS,
          keypair,
        });

        return keypair;
      })
      .catch(error => {
        dispatch({
          type: types.CLUSTER_CREATE_KEY_PAIR_ERROR,
          error,
        });

        console.error(error);
        throw error;
      });
  };
}
