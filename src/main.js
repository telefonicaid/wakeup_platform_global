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
    request = require('request'),
    ListenerHttp = require('./shared_libs/listener_http').ListenerHttp;

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

        request({
            url: URL,
            headers: {
                'x-tracking-id': wakeupdata.headers['x-tracking-id'],
                'x-real-ip': wakeupdata.headers['x-real-ip'],
                'x-forwarded-for': wakeupdata.headers['x-forwarded-for'],
                'x-client-cert-dn': wakeupdata.headers['x-client-cert-dn'],
                'x-client-cert-verified': wakeupdata.headers['x-client-cert-verified']
            }
        }, function(error, resp, body) {
            if (error) {
                log.info(Date.now() + ' -- ' + wakeupdata.headers['x-tracking-id'] +
                  ' -- ' + JSON.stringify(error));
                return;
            }
            log.info(Date.now() + ' -- ' + wakeupdata.headers['x-tracking-id'] +
              ' -- ' + resp.statusCode + ' -- ' + body);
        });
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
        }, 10000);
    }
};

exports.WUGlobalServer = WUGlobalServer;
