/* jshint node: true */
/**
 * Wake Up Platform
 * (c) Telefonica Digital, 2014 - All rights reserved
 * License: GNU Affero V3 (see LICENSE file)
 * Fernando Rodríguez Sela <frsela at tid dot es>
 * Guillermo López Leal <gll at tid dot es>
 */

var log = require('../shared_libs/logger');

module.exports.info = {
  name: 'aboutRouter',
  type: 'router',
  virtualpath: 'about',
  alias: [
    ''            // No path => default router
  ],
  description: 'This module shows the about page to the client'
};

module.exports.entrypoint = function router_about(parsedURL, body, req, res) {
  // <tracking-id> -- about -- <DN=Name> -- <external-ip>
  log.info(Date.now() + ' -- ' + req.headers['x-tracking-id'] +
    ' -- about -- ' + req.headers['x-client-cert-dn'] + ' -- ip=' +
    req.headers['x-real-ip']);
  res.setHeader('Content-Type', 'text/html;charset=UTF-8');
  res.statusCode = 200;
  res.write('<html><head>');
  res.write(
    '<meta http-equiv="Content-Type" content="text/html;charset=UTF-8">');
  res.write('</head><body>');
  res.write('<h1>WakeUp mobile platform</h1>');
  res.write('<h2>Global node ' + process.configuration._version + '</h2>');
  res.write('© Telefónica Digital, 2014<br />');
  res.write('</body></html>');
};
