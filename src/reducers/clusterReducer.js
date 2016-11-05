'use strict';

import * as types from '../actions/actionTypes';
import update from 'react-addons-update';

var metricKeys = [
  'cpu_cores',
  'cpu_used',
  'ram_available',
  'ram_used',
  'pod_count',
  'container_count',
  'node_storage_limit',
  'node_storage_used',
  'network_traffic_incoming',
  'network_traffic_outgoing'
];

// ensureMetricKeysAreAvailable
// ----------------------------
// Make sure that expected metrics keys are present on cluster and nodes
// since Desmotes will omit them if they are not found in Prometheus
var ensureMetricKeysAreAvailable = function (clusterDetails) {
  for (var metricKey of metricKeys) {
    clusterDetails.metrics[metricKey] = Object.assign(
      {
        value: 0,
        unit: 'unknown',
        timestamp: 0
      },
      clusterDetails.metrics[metricKey]
    );

    for (var node in clusterDetails.nodes) {
      if (clusterDetails.nodes.hasOwnProperty(node)) {
        clusterDetails.nodes[node][metricKey] = Object.assign(
          {
            value: 0,
            unit: 'unknown',
            timestamp: 0
          },
          clusterDetails.nodes[node][metricKey]
        );
      }
    }
  }

  return clusterDetails;
};

export default function clusterReducer(state = {lastUpdated: 0, isFetching: false, items: {}}, action = undefined) {
  switch(action.type) {
    case types.CLUSTER_LOAD_PARTIAL_DETAILS:
      var items = Object.assign({}, state.items);

      items[action.cluster.id] = action.cluster;
      items[action.cluster.id].nodes = [];

      return {
        lastUpdated: state.lastUpdated,
        isFetching: false,
        items: items
      };

      break;

    case types.CLUSTER_LOAD_DETAILS_SUCCESS:
      var items = Object.assign({}, state.items);

      items[action.cluster.id] = Object.assign({}, items[action.cluster.id], action.cluster);

      return {
        lastUpdated: state.lastUpdated,
        isFetching: false,
        items: items
      };

      break;

    case types.CLUSTER_LOAD_METRICS_SUCCESS:
      var nodes = {};
      var metrics = action.metrics;

      for (var metricName in metrics.nodes) {
        if (metrics.nodes.hasOwnProperty(metricName)) {
          for (var nodeMetric of metrics.nodes[metricName].instances) {
            nodes[nodeMetric.instance] = Object.assign({}, nodes[nodeMetric.instance]);
            nodes[nodeMetric.instance].id = nodeMetric.instance;
            nodes[nodeMetric.instance][metricName] = {
              value: nodeMetric.value,
              unit: metrics.nodes[metricName].unit,
              timestamp: nodeMetric.timestamp
            };
          }
        }
      }

      var items = Object.assign({}, state.items);

      var clusterDetails = update(items[action.clusterId], {
        metrics: {$set: metrics.cluster},
        nodes: {$set: nodes}
      });

      clusterDetails = ensureMetricKeysAreAvailable(clusterDetails);

      items[action.clusterId] = clusterDetails;

      return {
        lastUpdated: state.lastUpdated,
        isFetching: false,
        items: items
      };

      break;

    default:
      return state;
  }
}
