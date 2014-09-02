var ukUrl = 'http://www.notonthehighstreet.com';
var deUrl = 'http://preview.notonthehighstreet.de';

var http = require('http');
http.globalAgent.maxSockets = 300;
var https = require('https');
https.globalAgent.maxSockets = 300;

var EventEmitter = require('events').EventEmitter;
var async = require('async');
var _ = require('lodash-node');

var Order = require('./order.js');
var geoLookup = require('./geo-lookup.js');
var request = require('request');

module.exports = new EventEmitter();

module.exports.setMaxListeners(0);

// Find the different objects between two arrays of objects
_.deepDiff = function(array, exclusionArray) {
    return _.reject(array, function(item) {
        return exclusionArray.some(function(exclusionItem) {
            return _.isEqual(exclusionItem, item);
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
                requestOrders(url, callback);
            }, 1000);

            if (error || response.statusCode !== 200) return;

            try {
                data = JSON.parse(body);
            } catch(e) {
                return;
            }

            if (data.products.length) {
                var orders = data.products;
                var newOrders = _.deepDiff(orders, lastOrders);
                lastOrders = orders;
                if (!newOrders.length) return;
            }

            console.log("--- " + newOrders.length + " NEW ORDER(S) FROM: " + url);
            console.log(newOrders);
            console.log("--- END ---");
            callback(newOrders);
        });
    };

    requestOrders();
}

var processOrders = function(ordersData, origin, callback) {
    var processOrderData = function(orderData, callback) {

        async.mapSeries([order.senderAddress, order.deliveryAddress], geoLookup.getLocation.bind(geoLookup), function(err, coordinates) {
            if (err || !coordinates[0] || !coordinates[1]) {
                console.log(err);

                // Even if we can't fetch coordinates, we should still return the
                // original order to avoid losing it entirely
                callback(null, order);
                return;
            }

            order.product.geo.coordinate = {
                lat: coordinates[0].lat,
                lon: coordinates[0].lng
            };

            order.geo.coordinate = {
                lat: coordinates[1].lat,
                lon: coordinates[1].lng
            };

            callback(null, order);
        });
    };

    // All this async stuff could go away if the geoLookup provided some sort
    // of queueing for requests. Otherwise we get 500s back from google.
    async.mapSeries(ordersData, processOrderData, function(err, orders) {
        orders.forEach(function(order) {
            callback(order);
        });
    });
};

[ukUrl, deUrl].forEach(function(url) {
    getOrders(url, function(ordersData) {
        ordersData.forEach(function(orderData) {
            var order = new Order(orderData);
            order.origin = url;
            module.exports.emit('order', order);
        });
    });
});
