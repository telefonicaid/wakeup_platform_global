/**
 * Wake Up Platform
 * (c) Telefonica Digital, 2014 - All rights reserved
 * License: GNU Affero V3 (see LICENSE file)
 * Fernando Rodríguez Sela <frsela at tid dot es>
 * Guillermo López Leal <gll at tid dot es>
 */

'use strict';

var http = require('http'),
    url = require('url'),
    log = require('../shared_libs/logger'),
    config = process.configuration;

function WakeupSender() {
}

WakeupSender.prototype = {
    wakeup: function _wakeup(wakeupdata) {
      var URL = wakeupdata.network.host + '/wakeup?ip=' + wakeupdata.ip +
        '&port=' + wakeupdata.port;
      if (wakeupdata.proto) {
          URL += '&proto=' + wakeupdata.proto;
      }
      log.debug('Sending wakeup query to: ' + URL);

      // TODO: Change method to POST as soon as all local nodes support it
      log.info(Date.now() + ' -- ' + wakeupdata.headers['x-tracking-id'] +
          ' -- Launching query to local node at ' + URL);
      var parsedURL = url.parse(URL);
      var agent = new http.Agent();
      if (config.maxSocketConnections === -1) {
        log.debug('Allowing unlimit sockets connections to local node');
        agent.maxSockets = Infinity;
      } else if(config.maxSocketConnections) {
        log.debug('Allowing ' + config.maxSocketConnections +
          ' parallel sockets to local node');
        agent.maxSockets = config.maxSocketConnections;
      } else {
        log.debug('Leaving default number of sockets to local node');
      }
      var req = http.request({
          hostname: parsedURL.hostname,
          port: parsedURL.port,
          path: parsedURL.path,
          method: 'GET',
          headers: {
              'x-tracking-id': wakeupdata.headers['x-tracking-id'],
              'x-real-ip': wakeupdata.headers['x-real-ip'],
              'x-forwarded-for': wakeupdata.headers['x-forwarded-for'],
              'x-client-cert-dn': wakeupdata.headers['x-client-cert-dn'],
              'x-client-cert-verified':
                  wakeupdata.headers['x-client-cert-verified']
          },
          agent: agent
      }, function(resp) {
          var body = '';
          resp.on('data', function (chunk) {
              body += chunk;
          });
          resp.on('end', function (chunk) {
              if (chunk) body += chunk;
              log.info(Date.now() + ' -- ' +
                  wakeupdata.headers['x-tracking-id'] + ' -- ' +
                  resp.statusCode + ' -- ' + body);
          });
      });
      req.on('error', function(e) {
        log.error(Date.now() + ' -- ' + wakeupdata.headers['x-tracking-id'] +
              ' -- Error sending to local: ' + e.message);
      });
      req.end();
    }
};

var wusender = new WakeupSender();
function getWakeUpSender() {
    return wusender;
}
module.exports = getWakeUpSender();
