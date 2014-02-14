/* jshint node: true */
/**
 * Wake Up Platform
 * (c) Telefonica Digital, 2014 - All rights reserved
 * License: GNU Affero V3 (see LICENSE file)
 * Fernando Rodríguez Sela <frsela at tid dot es>
 * Guillermo López Leal <gll at tid dot es>
 */

var log = require('../shared_libs/logger'),
    querystring = require('querystring'),
    net = require('net'),
    mn = require('../libs/mobile_networks')('../networks.json');

module.exports.info = {
  name: 'wakeupRouter',
  type: 'router',
  virtualpath: 'wakeup/v1',
  description: 'The heart of the system: Used to wakeup devices (V1)'
};

function processWakeUpQuery(paramsString, request, response, cb) {
  response.setHeader('Content-Type', 'text/plain');

  // Check request ...
  if (!paramsString) {
    log.debug('WU_ListenerHTTP_WakeUpRouter --> No required data provided');
    response.statusCode = 400;
    response.write('Bad parameters. No required data provided');
    return;
  }
  var wakeup_data = querystring.parse(paramsString);

  // Check parameters
  if (!net.isIP(wakeup_data.ip) ||     // Is a valid IP address
      isNaN(wakeup_data.port) ||       // The port is a Number
      wakeup_data.port <= 0 || wakeup_data.port > 65535 // Port in a valid range
  ) {
    log.debug('WU_ListenerHTTP_WakeUpRouter --> Bad IP/Port');
    response.statusCode = 400;
    response.write('Bad parameters. Bad IP/Port');
    return;
  }

  // Check protocol
  if ((!wakeup_data.netid || typeof(wakeup_data.netid) !== 'string') &&
      (!wakeup_data.mcc || !wakeup_data.mnc ||
       isNaN(wakeup_data.mcc) || isNaN(wakeup_data.mnc))) {
    log.debug('WU_ListenerHTTP_WakeUpRouter --> Bad NetID OR MCC/MNC');
    response.statusCode = 400;
    response.write('Bad parameters. Bad NetID OR MCC/MNC');
    return;
  }

  // If no netid defined, we'll use MCC/MNC pair
  if (!wakeup_data.netid) {
    wakeup_data.netid =
      mn.getNetworkIDForMCCMNC(wakeup_data.mcc, wakeup_data.mnc);
  }

  // The format is OK, but are the values OK too?
  wakeup_data.network = mn.getNetworkForIP(wakeup_data.netid, wakeup_data.ip);
  if (wakeup_data.network.error) {
    log.error('Bad network: ' + wakeup_data.network.error);
    response.statusCode = wakeup_data.network.code;
    response.write(wakeup_data.network.error);
    return;
  }

  // Network found :) - Checking network status
  if (wakeup_data.network.offline) {
    var msg = 'Error, network ' + wakeup_data.netid + ' is offline now';
    log.error(msg);
    response.statusCode = 503;
    response.write(msg);
    return;
  }
  // If the network informs about supported protocols, an extra check is done :)
  if (wakeup_data.proto && wakeup_data.network.protocols &&
      wakeup_data.network.protocols.indexOf(wakeup_data.proto) == -1) {
    var msg = 'Error, protocol ' + wakeup_data.proto + ' is not accepted by ' +
              wakeup_data.netid + ' network';
    log.error(msg);
    response.statusCode = 400;
    response.write(msg);
    return;
  }

  // All Ok, we can wakeup the device !
  log.debug('WU_ListenerHTTP_WakeUpRouter --> WakeUp IP = ' + wakeup_data.ip +
    ':' + wakeup_data.port +
    ' network (' + wakeup_data.mcc + '-' + wakeup_data.mnc + ' | ' +
      wakeup_data.netid + ')');

  log.info(Date.now() + ' -- ' + request.headers['x-tracking-id'] +
    ' -- wakeup/v1 -- ' + request.headers['x-client-cert-dn'] + ' -- ' +
    wakeup_data.mcc + ' -- ' + wakeup_data.mnc + ' -- ' + wakeup_data.netid +
    ' -- ' + wakeup_data.ip + ':' + wakeup_data.port + ' -- ' +
    wakeup_data.protocol + ' -- ' + request.headers['x-real-ip']);

  response.statusCode = 200;
  response.write('Accepted');

  // Append client information stored in request HEADERS
  wakeup_data.headers = request.headers;

  process.nextTick(function() {
    cb(wakeup_data);
  });
}

module.exports.entrypoint =
  function router_wakeupV1(parsedURL, body, request, response, cb) {
    switch (request.method) {
    case 'POST':
      processWakeUpQuery(body, request, response, cb);
      break;

    case 'OPTIONS':
      // CORS support
      log.debug('WU_ListenerHTTP_WakeUpRouter --> Received an OPTIONS method');
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.statusCode = 200;
      break;

    default:
      response.setHeader('Content-Type', 'text/plain');
      response.statusCode = 405;
      response.write('Bad method. Only POST is allowed');
      log.debug('WU_ListenerHTTP_WakeUpRouter --> Bad method - ' +
        request.method);
    }
  };
