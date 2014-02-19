/**
 * Wake Up Platform
 * (c) Telefonica Digital, 2014 - All rights reserved
 * License: GNU Affero V3 (see LICENSE file)
 * Fernando Rodríguez Sela <frsela at tid dot es>
 * Guillermo López Leal <gll at tid dot es>
 */

'use strict';

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
    var wakeupData = querystring.parse(paramsString);

    // Check parameters
    if (!net.isIP(wakeupData.ip) ||     // Is a valid IP address
        isNaN(wakeupData.port) ||       // The port is a Number
        wakeupData.port <= 0 || wakeupData.port > 65535 // Port in a valid range
    ) {
        log.debug('WU_ListenerHTTP_WakeUpRouter --> Bad IP/Port');
        response.statusCode = 400;
        response.write('Bad parameters. Bad IP/Port');
        return;
    }

    // Check protocol
    if ((!wakeupData.netid || typeof(wakeupData.netid) !== 'string') &&
        (!wakeupData.mcc || !wakeupData.mnc ||
         isNaN(wakeupData.mcc) || isNaN(wakeupData.mnc))) {
        log.debug('WU_ListenerHTTP_WakeUpRouter --> Bad NetID OR MCC/MNC');
        response.statusCode = 400;
        response.write('Bad parameters. Bad NetID OR MCC/MNC');
        return;
    }

    // If no netid defined, we'll use MCC/MNC pair
    if (!wakeupData.netid) {
        wakeupData.netid =
          mn.getNetworkIDForMCCMNC(wakeupData.mcc, wakeupData.mnc);
    }

    // The format is OK, but are the values OK too?
    wakeupData.network = mn.getNetworkForIP(wakeupData.netid, wakeupData.ip);
    if (wakeupData.network.error) {
        log.error('Bad network: ' + wakeupData.network.error);
        response.statusCode = wakeupData.network.code;
        response.write(wakeupData.network.error);
        return;
    }

    var msg = '';
    // Network found :) - Checking network status
    if (wakeupData.network.offline) {
        msg = 'Error, network ' + wakeupData.netid + ' is offline now';
        log.error(msg);
        response.statusCode = 503;
        response.write(msg);
        return;
    }
    // If the network informs about supported protocols, an extra check is done :)
    if (wakeupData.proto && wakeupData.network.protocols &&
        wakeupData.network.protocols.indexOf(wakeupData.proto) == -1) {
        msg = 'Error, protocol ' + wakeupData.proto + ' is not accepted by ' +
                  wakeupData.netid + ' network';
        log.error(msg);
        response.statusCode = 400;
        response.write(msg);
        return;
    }

    // All Ok, we can wakeup the device !
    log.debug('WU_ListenerHTTP_WakeUpRouter --> WakeUp IP = ' + wakeupData.ip +
      ':' + wakeupData.port +
      ' network (' + wakeupData.mcc + '-' + wakeupData.mnc + ' | ' +
        wakeupData.netid + ')');

    log.info(Date.now() + ' -- ' + request.headers['x-tracking-id'] +
      ' -- wakeup/v1 -- ' + request.headers['x-client-cert-dn'] + ' -- ' +
      wakeupData.mcc + ' -- ' + wakeupData.mnc + ' -- ' + wakeupData.netid +
      ' -- ' + wakeupData.ip + ':' + wakeupData.port + ' -- ' +
      wakeupData.protocol + ' -- ' + request.headers['x-real-ip']);

    response.statusCode = 200;
    response.write('Accepted');

    // Append client information stored in request HEADERS
    wakeupData.headers = request.headers;

    process.nextTick(function() {
        cb(wakeupData);
    });
}

module.exports.entrypoint =
    function routerWakeupV1(parsedURL, body, request, response, cb) {
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
