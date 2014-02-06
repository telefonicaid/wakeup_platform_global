/* jshint node: true */
/**
 * Wake Up Platform
 * (c) Telefonica Digital, 2014 - All rights reserved
 * License: GNU Affero V3 (see LICENSE file)
 * Fernando Rodríguez Sela <frsela at tid dot es>
 * Guillermo López Leal <gll at tid dot es>
 */

var config = require('./shared_libs/configuration'),
    log = require('./shared_libs/logger'),
    plugins_loader = require('./shared_libs/plugins_loader'),
    mn = require('./libs/mobile_networks'),
    request = require('request');
    ListenerHttp = require('./shared_libs/listener_http').ListenerHttp;

function WU_Global_Server() {
  this.http_listeners = [];
}

WU_Global_Server.prototype = {
  onWakeUpCommand: function(wakeupdata) {
    if (!wakeupdata.netid) {
      wakeupdata.netid =
        mn.getNetworkIDForMCCMNC(wakeupdata.mcc, wakeupdata.mnc);
    }
    var networkdata = mn.getNetworkForIP(wakeupdata.netid, wakeupdata.ip);

    if (networkdata.error) {
      log.error('Bad network: ' + networkdata.error);
      return;
    }

    var URL = networkdata.net.host + '/wakeup?ip=' + wakeupdata.ip +
      '&port=' + wakeupdata.port;
    if (wakeupdata.proto) {
      URL += '&proto=' + wakeupdata.proto;
    }
    log.info('Sending wakeup query to: ' + URL);

    request({
      url: URL,
      headers: {
        'x-real-ip': wakeupdata.headers['x-real-ip'],
        'x-forwarded-for': wakeupdata.headers['x-forwarded-for'],
        'x-client-cert-dn': wakeupdata.headers['x-client-cert-dn'],
        'x-client-cert-verified': wakeupdata.headers['x-client-cert-verified']
      }
    }, function(error, resp, body) {
      if (error) {
        log.error('Local node connection error: ' + error);
        return;
      }
      log.info('Notification delivered to local node ! - Response: (' +
        resp.statusCode + ') # ' + body);
    });
  },

  start: function() {
    // Start servers
    plugins_loader.load('routers');
    for (var a in config.interfaces) {
      this.http_listeners[a] = new ListenerHttp(
        config.interfaces[a].ip,
        config.interfaces[a].port,
        config.interfaces[a].ssl,
        plugins_loader.getRouters(),
        this.onWakeUpCommand);
      this.http_listeners[a].init();
    }

    log.info('WakeUp global server starting');
  },

  stop: function() {
    log.info('WakeUp global server stopping');

    this.http_listeners.forEach(function(server) {
      server.stop();
    });

    log.info('WakeUp global server waiting 10 secs for all servers stops ...');
    setTimeout(function() {
      log.info('WakeUp global server - Bye !');
      process.exit(0);
    }, 10000);
  }
};

exports.WU_Global_Server = WU_Global_Server;

