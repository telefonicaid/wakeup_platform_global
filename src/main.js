/**
 * Wake Up Platform
 * (c) Telefonica Digital, 2014 - All rights reserved
 * License: GNU Affero V3 (see LICENSE file)
 * Fernando Rodríguez Sela <frsela at tid dot es>
 * Guillermo López Leal <gll at tid dot es>
 */

'use strict';

var config = require('./shared_libs/configuration'),
    log = require('./shared_libs/logger'),
    pluginsLoader = require('./shared_libs/plugins_loader'),
    http = require('http'),
    url = require('url'),
    ListenerHttp = require('./shared_libs/listener_http').ListenerHttp;

log.setParams(config.log);

function WUGlobalServer() {
    this.httpListeners = [];
}

WUGlobalServer.prototype = {
    onWakeUpCommand: function(wakeupdata) {
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
        agent.maxSockets = Infinity;
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
    },

    start: function() {
        // Start servers
        pluginsLoader.load('routers');
        for (var a in config.interfaces) {
            this.httpListeners[a] = new ListenerHttp(
                config.interfaces[a].ip,
                config.interfaces[a].port,
                config.interfaces[a].ssl,
                pluginsLoader.getRouters(),
                this.onWakeUpCommand);
            this.httpListeners[a].init();
        }

        log.info('WakeUp global server starting');
    },

    stop: function() {
        log.info('WakeUp global server stopping');

        this.httpListeners.forEach(function(server) {
            server.stop();
        });

        log.info('WakeUp global server waiting 10 secs for all servers stops...');
        setTimeout(function() {
            log.info('WakeUp global server - Bye !');
            process.exit(0);
        }, 1000);
    }
};

exports.WUGlobalServer = WUGlobalServer;
