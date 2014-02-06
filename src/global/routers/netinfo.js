/* jshint node: true */
/**
 * Wake Up Platform
 * (c) Telefonica Digital, 2014 - All rights reserved
 * License: GNU Affero V3 (see LICENSE file)
 * Fernando Rodríguez Sela <frsela at tid dot es>
 * Guillermo López Leal <gll at tid dot es>
 */

var log = require('../shared_libs/logger'),
    mn = require('../../common/libs/mobile_networks.js');

module.exports.info = {
    name: 'netInfo',
    type: 'router',
    virtualpath: 'netinfo/v1',
    description: 'Returns a JSON with the MCC-MNC networks and state'
};

module.exports.entrypoint = function netInfo(parsedURL, body, req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.write(JSON.stringify(mn.getNetworkStatuses() || {}));
};
