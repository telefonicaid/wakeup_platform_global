/**
 * Wake Up Platform
 * (c) Telefonica Digital, 2014 - All rights reserved
 * License: GNU Affero V3 (see LICENSE file)
 * Fernando Rodríguez Sela <frsela at tid dot es>
 * Guillermo López Leal <gll at tid dot es>
 */

'use strict';

var request = require('request'),
    assert = require('assert'),
    vows = require('vows');

vows.describe('Listener ABOUT (no client certificate)').addBatch({
    'about HTML page': {
        topic: function() {
            request('http://localhost:8000/about', this.callback);
        },

        'Server responded with an about page': function(err, response, body) {
            assert.isNull(err);
            assert.isString(body);
            assert.equal(response.statusCode, 200);
            assert.isNotNull(response.headers['x-tracking-id']);
        }
    },

    'about HTML page (using alias)': {
        topic: function() {
            request('http://localhost:8000/', this.callback);
        },
        'Server responded with an about page': function(err, response, body) {
            assert.isNull(err);
            assert.isString(body);
            assert.equal(response.statusCode, 200);
            assert.isNotNull(response.headers['x-tracking-id']);
        }
    }
}).export(module);
