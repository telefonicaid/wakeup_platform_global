/* jshint node: true */
/**
 * Wake Up Platform
 * (c) Telefonica Digital, 2014 - All rights reserved
 * License: GNU Affero V3 (see LICENSE file)
 * Fernando Rodríguez Sela <frsela at tid dot es>
 * Guillermo López Leal <gll at tid dot es>
 */

'use strict';

var range_check = require('range_check'),
    request = require('request'),
    config = process.configuration,
    log = require('../shared_libs/logger.js');

var mn = function mobile_networks(networksPath) {
  var networks = require(networksPath);

  var checkWakeup = function(URL, callback) {
    log.debug('Checking ' + URL);
    var options = {
      url: URL,
      // We need to fake this for the local wakeup to
      // accept our query
      headers: {
        'x-client-cert-verified': 'SUCCESS',
        'x-client-cert-dn': 'Wakeup_checker'
      }
    };
    // Callback with true/false (online/offline) and the trackingID
    // if it is set to trace between wakeups
    request(options, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        log.debug(URL + ' success');
        callback(true, response.headers['x-tracking-id']);
      } else {
        log.debug(URL + ' failed');
        callback(false, (response && response.headers &&
                         response.headers['x-tracking-id'])
        );
      }
    });
  };

  var checkNetworks = function() {
    log.debug('checkNetworks() + ' + JSON.stringify(networks));
    var keys = Object.keys(networks);
    keys.forEach(function(id) {
      if (networks[id].host) {
        var toCheck = networks[id].host + '/about';
        checkWakeup(toCheck, function(online, trackingID) {
          log.info(Date.now() + ' -- ' + trackingID + ' -- wakeup_check -- ' +
            id + ' -- ' + networks[id].host + ' -- ' + (online ? 'OK' : 'KO'));
          online ? enableNetwork(id) :
                   disableNetwork(id);
        });
      }
    });
  };

  checkNetworks();
  setInterval(checkNetworks, config.check_interval);

  function getNetwork(netid) {
    var res = networks[netid];
    if (!res) {
      return null;
    }
    return res;
  }

  function getAllNetworks() {
    return networks;
  }

  function enableNetwork(networkName) {
    log.debug('Enabling network ' + networkName);
    var net = getNetwork(networkName);
    if (net) {
      networks[networkName].offline = false;
    }
  }

  function disableNetwork(networkName) {
    log.debug('Disabling network ' + networkName);
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
        return { error: 'No valid device IP', code: 400 };
      }

      var network = getNetwork(netid);
      if (!network) {
        return { error: 'No network found', code: 404 };
      }

      // Client IP is out of the mobile network
      if (!range_check.in_range(deviceip, network.range)) {
        return {
          error: 'Client IP (' + deviceip +
            ') is out of the mobile network range - ' + network.range,
          code: 400
        };
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
    }
  };
};

module.exports = function(networksPath) {
  return mn(networksPath);
};
