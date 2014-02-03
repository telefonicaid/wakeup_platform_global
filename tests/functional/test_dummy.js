/* jshint node: true */
/**
 * Wake Up Platform
 * (c) Telefonica Digital, 2014 - All rights reserved
 * License: GNU Affero V3 (see LICENSE file)
 * Fernando Rodríguez Sela <frsela at tid dot es>
 * Guillermo López Leal <gll at tid dot es>
 */

var assert = require('assert'),
    vows = require('vows');

vows.describe('DUMMY').addBatch({
  'dummy': {
    'dummy': function() {
      assert.isTrue(true);
    }
  }
}).export(module);
