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

            if (data.products.length && lastOrderId != data.last_order_id) {
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

var processOrderData = function(orderData, callback) {
    var order = new Order(orderData);

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

getOrders(ukUrl, function(ordersData) {
    console.log("--- NEW ORDERS ---");
    console.log(ordersData.length);

    async.mapSeries(ordersData, processOrderData, function(err, orders) {
        // Compact orders
        orders = orders.filter(function(n){
            return n;
        });

        module.exports.emit('orders', orders);

        var intlOrders = orders.filter(function(order) {
            return order.geo.country != order.product.geo.country;
        });

        if (intlOrders.length) {
            module.exports.emit('intl_orders', intlOrders);
        }
    });
});
