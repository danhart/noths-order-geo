var ukUrl = 'http://www.notonthehighstreet.com';
var deUrl = 'http://preview.notonthehighstreet.de';

var util = require('util');
var http = require('http');
http.globalAgent.maxSockets = 300;
var https = require('https');
https.globalAgent.maxSockets = 300;

var EventEmitter = require('events').EventEmitter;
var _ = require('lodash-node');

var Order = require('./order');
var request = require('request');

module.exports = new EventEmitter();

module.exports.setMaxListeners(0);

// Find the different objects between two arrays of objects
// This is needed as order IDs are not exposed by the /map API
_.deepDiff = function(array, exclusionArray, comparison) {
    return _.reject(array, function(item) {
        return exclusionArray.some(function(exclusionItem) {
            return _.isEqual(exclusionItem, item, comparison);
        });
    });
};

function getOrders(url, callback) {
    var lastOrders = [];

    var options = {
        url: url + "/map",
        headers: {
            'Content-Type':     'application/json',
            'Accept':           'application/json, text/javascript',
            'X-Requested-With': 'XMLHttpRequest'
        }
    };

    var requestOrders = function() {
        request(options, function (error, response, body) {
            var data;
            var orders = [];
            var newOrders = [];

            setTimeout(function() {
                requestOrders();
            }, 1000);

            if (error || response.statusCode !== 200) return;

            try {
                data = JSON.parse(body);
            } catch(e) {
                return;
            }

            if (data.products.length && !lastOrders.length) {
                lastOrders = data.products;
                return;
            }

            if (data.products.length) {
                orders = data.products;

                newOrders = _.deepDiff(orders, lastOrders, function(a, b) {
                    return a.product.url === b.product.url &&
                        a.total.amount === b.total.amount &&
                        a.geo.country === b.geo.country &&
                        a.geo.county === b.geo.county &&
                        a.geo.place === b.geo.place;
                });

                lastOrders = orders;
                if (!newOrders.length) return;
            }

            util.log("--- " + newOrders.length + " NEW ORDER(S) FROM: " + url);
            callback(newOrders);
        });
    };

    requestOrders();
}

[ukUrl, deUrl].forEach(function(url) {
    getOrders(url, function(ordersData) {
        ordersData.forEach(function(orderData) {
            var order = new Order(orderData);
            order.origin = url;
            module.exports.emit('order', order);
        });
    });
});
