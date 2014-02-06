/* jshint node: true */
/**
 * Wake Up Platform
 * (c) Telefonica Digital, 2014 - All rights reserved
 * License: GNU Affero V3 (see LICENSE file)
 * Fernando Rodríguez Sela <frsela at tid dot es>
 * Guillermo López Leal <gll at tid dot es>
 */

'use strict';

var config = process.configuration,
    redis = require('redis'),
    helpers = require('../shared_libs/helpers'),
    range_check = require('range_check');

module.exports = (function mobile_networks() {
  var client = redis.createClient(config.redis.port, config.redis.host,
    config.redis.options);
  init();

  function init() {
    var client_cache = redis.createClient(config.redis.port, config.redis.host,
      config.redis.options);
    client_cache.on('message', function onMessage(channel, message) {
      if (channel === 'networks_changed') {
        clearCache();
      }
    });
    client_cache.subscribe('networks_changed');

    client.on('error', function(err) {
      console.error('Mobile networks error: ' + err);
    });
    client_cache.on('error', function(err) {
      console.error('Mobile networks cache error: ' + err);
    });
  }

  function clearCache() {
    console.log('[ToDo] limpiando cache');
  }

  function getOperator(mcc, mnc, callback) {
    client.hget('operators', mcc + '-' + mnc, function(e, operatorData) {
      try {
        var data = JSON.parse(operatorData);
        callback(null, data);
      } catch (e) {
        callback(e);
      }
    });
  }

  function getNetworkByNetID(netid, callback) {
    client.hget('networks', netid, function(e, networkData) {
      try {
        var data = JSON.parse(networkData);
        callback(null, data);
      } catch (e) {
        callback(e);
      }
    });
  }

  function getNetworkByMCCMNC(mcc, mnc, callback) {
    getOperator(mcc, mnc, function(e, data) {
      if (e) {
        callback(e);
        return;
      }
      if (data.defaultNetwork) {
        getNetworkByNetID(data.defaultNetwork, callback);
      } else {
        callback('Mobile Network without wakeup host');
      }
    });
  }

  function getAllNetworks(callback) {
    client.hgetall('networks', callback);
  }

  function enableNetwork(networkName) {
    getNetworkByNetID(networkName, function(err, data) {
      if (err) return;
      data.offline = false;
      client.hset('networks', networkName, JSON.stringify(data));
    });
  }

  function disableNetwork(networkName) {
    getNetworkByNetID(networkName, function(err, data) {
      if (err) return;
      data.offline = true;
      client.hset('networks', networkName, JSON.stringify(data));
    });
  }

  return {
    getNetwork: function(netid, callback) {
      callback = helpers.checkCallback(callback);

      if (typeof(netid) === 'object') {
        if (!netid.mcc || !netid.mnc) {
          callback('No valid netid object');
          return;
        }
        getNetworkByMCCMNC(netid.mcc, netid.mnc, callback);
      } else {
        getNetworkByNetID(netid, callback);
      }
    },

    getOperator: function(operator, callback) {
      if (typeof(callback) != 'function') {
        callback = function() {};
      }

      if (typeof(operator) !== 'object' ||
          !operator.mcc || !operator.mnc) {
        callback('No valid operator object');
        return;
      }

      getOperator(operator.mcc, operator.mnc, callback);
    },

    // Checks if the deviceip is in a valid range for the specified network
    checkNetwork: function(netid, deviceip, callback) {
      if (typeof(callback) != 'function') {
        callback = function() {};
      }

      if (!range_check.valid_ip(deviceip)) {
        callback('No valid device IP');
        return;
      }

      this.getNetwork(netid, function(error, data) {
        if (error || !data) {
          callback(error || 'No network found');
          return;
        }
        // Client IP is out of the mobile network
        if (!range_check.in_range(deviceip, data.range)) {
          callback('Client IP (' + deviceip +
            ') is out of the mobile network range - ' + data.range);
          return;
        }
        callback(null, data);
      });
    },

    // Returns an array with all networks with a local node in them
    getNetworksWithLocalNode: function(callback) {
      if (typeof(callback) != 'function') {
        return;
      }
      getAllNetworks(function(err, networks) {
        if (err)
          return callback(err);

        // Convert to an array
        var nets = [];
        var k = Object.keys(networks);
        for (var i = 0; i < k.length; i++) {
          try {
            var json = JSON.parse(networks[k[i]]);
          } catch (e) {
            log.debug('mobile_networks: Error parsing network data');
          }
          nets.push({
            name: k[i],
            info: json
          });
        }
        callback(null, nets);
      });
    },

    // Enable/Disable network status
    changeNetworkStatus: function(networkName, networkStatus) {
      if (networkStatus) {
        enableNetwork(networkName);
      } else {
        disableNetwork(networkName);
      }
    },

    // Returns network information which is periodically updated for
    // down wakeup nodes
    getNetworkStatuses: function() {
        // TODO
    }
  };
})();
