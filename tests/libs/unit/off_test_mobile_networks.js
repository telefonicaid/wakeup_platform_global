/* jshint node: true */
/**
 * Wake Up Platform
 * (c) Telefonica Digital, 2014 - All rights reserved
 * License: GNU Affero V3 (see LICENSE file)
 * Fernando Rodríguez Sela <frsela at tid dot es>
 * Guillermo López Leal <gll at tid dot es>
 */

require('./configuration');
var mn = require('../../../src/libs/mobile_networks')(
                 '../../tests/libs/unit/networks_test.json'),
    assert = require('assert'),
    vows = require('vows'),
    net = require('net');

function checkRanges(range) {
  function checkNetwork(network) {
    try {
      var aux = network.split('/');
    } catch (e) {
      assert.isFalse(true);
      return;
    }
    assert.isNumber(net.isIP(aux[0]));
    assert.isNumber(parseInt(aux[1]));
  }
  if (typeof(range) !== 'string') {
    assert.isArray(range);
    for (a = 0; a < range.length; a++) {
      checkNetwork(range[a]);
    }
  } else {
    checkNetwork(range);
  }
}

vows.describe('Mobile Networks tests').addBatch({
  'Getting invalid network': {
    'Error returned': function() {
      var net = mn.getNetworkForIP(mn.getNetworkIDForMCCMNC('000', '00'), '');
      assert.isString(net.error);
    }
  },

  'Getting invalid operator (Bad object)': {
    'Error returned': function() {
      var net = mn.getNetworkForIP('', '');
      assert.isString(net.error);
    }
  },

  'Getting invalid network': {
    'Error returned': function() {
      var net = mn.getNetworkForIP('networkbad', '');
      assert.isString(net.error);
    }
  },

  'Getting network data': {
    'No error returned': function() {
      var data = mn.getNetworkForIP('network2-1-1b', '10.1.2.3');
      assert.isUndefined(data.error);
    },
    'Network has a host': function() {
      var data = mn.getNetworkForIP('network2-1-1b', '10.1.2.3');
      assert.isString(data.host);
    },
    'Network has a defined range': function() {
      var data = mn.getNetworkForIP('network2-1-1b', '10.1.2.3');
      checkRanges(data.range);
    },
    'Network has a parent network id': function() {
      var data = mn.getNetworkForIP('network2-1-1b', '10.1.2.3');
      assert.isString(data.network);
    }
  },

  'Check Network IP range (in Range 1)': {
    'No error returned': function() {
      var data = mn.getNetworkForIP('network1-1-1', '10.1.2.3');
      assert.isUndefined(data.error);
    },
    'Network has a host': function() {
      var data = mn.getNetworkForIP('network1-1-1', '10.1.2.3');
      assert.isString(data.host);
    },
    'Network has a defined range': function() {
      var data = mn.getNetworkForIP('network1-1-1', '10.1.2.3');
      checkRanges(data.range);
    },
    'Network has a parent network id': function() {
      var data = mn.getNetworkForIP('network1-1-1', '10.1.2.3');
      assert.isString(data.network);
    }
  },

  'Check Network IP range (in Range 2)': {
    'No error returned': function() {
      var data = mn.getNetworkForIP('network1-1-1', '192.168.1.3');
      assert.isUndefined(data.error);
    },
    'Network has a host': function() {
      var data = mn.getNetworkForIP('network1-1-1', '192.168.1.3');
      assert.isString(data.host);
    },
    'Network has a defined range': function() {
      var data = mn.getNetworkForIP('network1-1-1', '192.168.1.3');
      checkRanges(data.range);
    },
    'Network has a parent network id': function() {
      var data = mn.getNetworkForIP('network1-1-1', '192.168.1.3');
      assert.isString(data.network);
    }
  },

  'Check Network IP range (Out of range)': {
    'Error returned': function() {
      var data = mn.getNetworkForIP('network1-1-1', '192.168.2.10');
      assert.isNotNull(data);
    }
  },

  'Get all networks': {
    'No error is returned': function() {
      var data = mn.getAllNetworks();
      assert.isObject(data);
    },
    'Networks array returned': function() {
      var data = mn.getAllNetworks();
      assert.isObject(data);
    }
  }
}).export(module);
