var ukUrl = 'http://www.notonthehighstreet.com';
var deUrl = 'http://preview.notonthehighstreet.de';

var EventEmitter = require('events').EventEmitter;
var async = require('async');
var Order = require('./order.js');
var geoService = require('./geo_service.js');
var request = require('request');

module.exports = new EventEmitter();

function getOrders(url, callback) {
    var lastOrderId;

    var orderRequest = function(callback) {
        var options = {
            url: url + "/map?last_order_id=" + lastOrderId,
            headers: {
                'Content-Type':     'application/json',
                'Accept':           'application/json, text/javascript',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        request(options, function (error, response, body) {
            var data;

            if (error || response.statusCode !== 200) return;

            try {
                data = JSON.parse(body);
            } catch(e) {
                return callback([]);
            }

            if (data.products.length && lastOrderId && lastOrderId != data.last_order_id) {
                callback(data.products);
            }

            lastOrderId = data.last_order_id;
        });
    };

    orderRequest(callback);

    setInterval(function() {
        orderRequest(callback);
    }, 5000);
}

var processOrders = function(ordersData, origin, callback) {
    console.log("--- " + ordersData.length + " NEW ORDER(S) FROM: " + origin);

    var processOrderData = function(orderData, callback) {
        var order = new Order(orderData);
        order.origin = origin;

        async.mapSeries([order.senderAddress, order.deliveryAddress], geoService.getLocation.bind(geoService), function(err, coordinates) {
            if (err || !coordinates[0] || !coordinates[1]) {
                console.log(err);
                callback(null, null);
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

    // All this async stuff could go away if the geoService provided some sort
    // of queueing for requests. Otherwise we get 500s back from google.
    async.mapSeries(ordersData, processOrderData, function(err, orders) {
        // Compact orders
        orders = orders.filter(function(n){
            return n;
        });

        callback(orders);
    });
};

// TODO: This should all be moved onto the OrderCollection
var emitOrders = function(orders) {
    module.exports.emit('orders', orders);

    orders.forEach(function(order) {
        module.exports.emit('order', order);
    });

    var intlOrders = orders.filter(function(order) {
        return order.geo.country != order.product.geo.country;
    });

    if (intlOrders.length) {
        module.exports.emit('intl_orders', intlOrders);

        intlOrders.forEach(function(order) {
            module.exports.emit('intl_order', order);
        });
    }
};

getOrders(ukUrl, function(ordersData) {
    processOrders(ordersData, ukUrl, function(orders) {
        emitOrders(orders);
    });
});

getOrders(deUrl, function(ordersData) {
    processOrders(ordersData, deUrl, function(orders) {
        emitOrders(orders);
    });
});
