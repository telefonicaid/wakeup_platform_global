/**
 * Wake Up Platform
 * (c) Telefonica Digital, 2014 - All rights reserved
 * License: GNU Affero V3 (see LICENSE file)
 * Fernando Rodríguez Sela <frsela at tid dot es>
 * Guillermo López Leal <gll at tid dot es>
 */

'use strict';

var assert = require('assert'),
    request = require('request'),
    vows = require('vows');

vows.describe('Global node WakeUp tests').addBatch({
    'Bad query': {
        topic: function sendWakeupBadParameters() {
            var self = this;
            var body = 'ip=127.0.0.1&port=1234';
            var url = 'http://localhost:8000/wakeup/v1';
            request.post(url, {
                body: body,
                headers: {
                    'x-real-ip': '127.0.0.1',
                    'x-forwarded-for': '127.0.0.1',
                    'x-client-cert-dn': 'DN=Testing',
                    'x-client-cert-verified': 'SUCCESS'
                }
            }, function(error, response, body) {
                if (error) {
                    self.callback(error.toString());
                    return;
                }
                self.callback(error, response, body);
            });
        },

        'Check status code': function(err, res/*, body*/) {
            assert.equal(res.statusCode, 400);
        },
        'Received data has the expected format': function(err, res, body) {
            assert.isString(body);
            assert.equal(body.substr(0, 36), 'Bad parameters. Bad NetID OR MCC/MNC');
        }
    },

    'With DOWN wakeup, Network ID': {
        topic: function sendWakeupNetworkID() {
            var self = this;
            var body = 'ip=10.0.0.1&port=1234&netid=network2-1-1';
            var url = 'http://localhost:8000/wakeup/v1';
            request.post(url, {
                body: body,
                headers: {
                    'x-real-ip': '127.0.0.1',
                    'x-forwarded-for': '127.0.0.1',
                    'x-client-cert-dn': 'DN=Testing',
                    'x-client-cert-verified': 'SUCCESS'
                }
            }, function(error, response, body) {
                if (error) {
                    self.callback(error.toString());
                    return;
                }
                self.callback(error, response, body);
            });
        },

        'Check status code': function(err, res/*, body*/) {
            assert.equal(res.statusCode, 503);
        },
        'Received data has the expected format': function(err, res, body) {
            assert.isString(body);
            assert.equal(body.substr(0, 14), 'Error, network');
        }
    },

    'With DOWN wakeup, MCC/MNC': {
        topic: function sendWakeupMCCMNC() {
            var self = this;
            var body = 'ip=10.0.0.1&port=1234&mcc=214&mnc=07';
            var url = 'http://localhost:8000/wakeup/v1';
            request.post(url, {
                body: body,
                headers: {
                    'x-real-ip': '127.0.0.1',
                    'x-forwarded-for': '127.0.0.1',
                    'x-client-cert-dn': 'DN=Testing',
                    'x-client-cert-verified': 'SUCCESS'
                }
            }, function(error, response, body) {
                if (error) {
                    self.callback(error.toString());
                    return;
                }
                self.callback(error, response, body);
            });
        },

        'Check status code': function(err, res/*, body*/) {
            assert.equal(res.statusCode, 503);
        },
        'Received data has the expected format': function(err, res, body) {
            assert.isString(body);
            assert.equal(body.substr(0, 14), 'Error, network');
        }
    }
}).export(module);
