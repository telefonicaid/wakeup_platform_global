/* jshint node: true */
/**
 * Wake Up Platform
 * (c) Telefonica Digital, 2014 - All rights reserved
 * License: GNU Affero V3 (see LICENSE file)
 * Fernando Rodríguez Sela <frsela at tid dot es>
 * Guillermo López Leal <gll at tid dot es>
 */

'use strict';

var operators = require('../operators.json'),
    networks = require('../networks.json'),
    range_check = require('range_check');

module.exports = (function mobile_networks() {
  function getNetwork(netid) {
    var res = networks[netid];
    if (!res) {
      return null;
    }
    return {
      net: res,
      MNO: operators[res.network]
    };
  }

  function getAllNetworks(callback) {
    return networks;
  }

  function enableNetwork(networkName) {
    var net = getNetwork(networkName);
    if (net) {
      networks[networkName].offline = false;
    }
  }

  function disableNetwork(networkName) {
    var net = getNetwork(networkName);
    if (net) {
      networks[networkName].offline = true;
    }
  }

  return {
    getNetworkIDForMCCMNC: function(mcc, mnc) {
      return mcc + '-' + mnc;
    },

    // Checks if the deviceip is in a valid range for the specified network
    getNetworkForIP: function(netid, deviceip) {
      if (!range_check.valid_ip(deviceip)) {
        return { error: 'No valid device IP' };
      }

      var network = getNetwork(netid);
      if (!network) {
        return { error: 'No network found' };
      }

      // Client IP is out of the mobile network
      if (!range_check.in_range(deviceip, network.net.range)) {
        return { error: 'Client IP (' + deviceip +
          ') is out of the mobile network range - ' + network.net.range };
      }

      return network;
    },

    // Returns an array with all networks with a local node in them
    getAllNetworks: function() {
      return getAllNetworks();
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
