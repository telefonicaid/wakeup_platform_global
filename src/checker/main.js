/* jshint node: true */
/**
 * Wake Up Platform
 * (c) Telefonica Digital, 2014 - All rights reserved
 * License: GNU Affero V3 (see LICENSE file)
 * Fernando Rodríguez Sela <frselacheckertid.es>
 * Guillermo Lopez Leal <gll@tid.checker>
 */

'use strict';

var config = require('./shared_libs/configuration'),
    log = require('./shared_libs/logger'),
    mn = require('./shared_libs/mobile_networks'),
    http = require('http'),
    https = require('https'),
    urlparser = require('url'),
    checkPeriod = config.checker.checkPeriod;

function WU_Checker_Server() {
  this.http_listeners = [];
}

WU_Checker_Server.prototype = {
  start: function() {
    log.info('WakeUp checker server starting');
    this.checkNetworks();
  },

  stop: function() {
    log.info('WakeUp checker server stopping');

    log.info('WakeUp checker server waiting 10 secs for all servers stops ...');
    setTimeout(function() {
      log.info('WakeUp checker server - Bye !');
      process.exit(0);
    }, 10000);
  },

  checkNetworks: function() {
    log.debug('WU_Checker_Server:checkNetworks -> Checking networks');
    var self = this;
    mn.getNetworksWithLocalNode(function(error, wakeUpNodes) {
      if (error || !Array.isArray(wakeUpNodes)) {
        log.error(
          'WU_Checker_Server:checkNetworks -> Error recovering networks');
        return;
      }

      wakeUpNodes.forEach(function(node) {
        log.debug(
          'WU_Checker_Server:checkNetworks --> Checking Local Proxy server',
          node);

        self.checkServer(node.info.host + '/status', function(err, res) {
          if (err || res.statusCode !== 200) {
            log.info('Failed network: ', node);
            mn.changeNetworkStatus(node.name, false);
          } else {
            log.info('Ok network: ', node);
            if (node.info.offline) {
              mn.changeNetworkStatus(node.name, true);
            }
          }
        });

      });
      setTimeout(function() {
        self.checkNetworks();
      }, checkPeriod);
    });
  },

  checkServer: function(url, cb) {
    // Send HTTP Notification Message
    var address = urlparser.parse(url);

    if (!address.href) {
      log.error('Error in URL');
      cb('Bad URL');
      return;
    }

    var protocolHandler = null;
    switch (address.protocol) {
      case 'http:':
        protocolHandler = http;
        break;
      case 'https:':
        protocolHandler = https;
        break;
      default:
        protocolHandler = null;
    }
    if (!protocolHandler) {
      log.debug(
        'WU_Checker_Server::checkServer --> Non valid URL (invalid protocol)');
      cb('Non valid URL (invalid protocol)');
      return;
    }
    var options = {
      hostname: address.hostname,
      port: address.port,
      path: '/status',
      agent: false,
      headers: {
        'x-real-ip': '0.0.0.0',
        'x-forwarded-for': '0.0.0.0',
        'x-client-cert-dn': 'DN=Global WakeUp Node Checker',
        'x-client-cert-verified': 'SUCCESS'
      }
    };
    protocolHandler.get(options, function(res) {
      cb(null, res);
    }).on('error', function(e) {
      cb(e.message);
    });
  }
};

exports.WU_Checker_Server = WU_Checker_Server;