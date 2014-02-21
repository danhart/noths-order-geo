var url = 'www.notonthehighstreet.com';
var http = require('http');
var EventEmitter = require('events').EventEmitter;
var async = require('async');
var Order = require('./order.js');
var geoService = require('./geo_service.js');
var ordersStore = require('./orders_store.js');

module.exports = new EventEmitter();

module.exports.getIntlOrders = function() {
    return ordersStore.intlOrders;
};

module.exports.getOrders = function() {
    return ordersStore.orders;
};

function getOrders(callback) {
    options = {
        hostname: url,
        path: "/map?last_order_id=" + ordersStore.lastOrderId,
        headers: {
            'Content-Type':     'application/json',
            'Accept':           'application/json, text/javascript',
            'X-Requested-With': 'XMLHttpRequest'
        }
    };

    http.get(options, function(res) {
        var body = '';

        res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('end', function() {
            var data = JSON.parse(body)

            if (data.products.length && ordersStore.lastOrderId != data.last_order_id) {
                callback(data.products);
            }

            ordersStore.setLastOrderId(data.last_order_id);
        });
    }).on('error', function(e) {
        console.log("Got error: ", e);
    });
}

function loop(callback) {
    getOrders(callback);

    setInterval(function() {
        getOrders(callback);
    }, 5000);
}

var processOrderData = function(orderData, callback) {
    var order = new Order(orderData);

    async.mapSeries([order.senderAddress, order.deliveryAddress], geoService.getLocation.bind(geoService), function(err, coordinates) {
        if (err) {
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

loop(function(ordersData) {
    console.log("--- NEW ORDERS ---");
    console.log(ordersData.length);

    async.mapSeries(ordersData, processOrderData, function(err, orders) {
        // Compact orders
        orders = orders.filter(function(n){return n});

        module.exports.emit('orders', orders);
        ordersStore.addOrders(orders);

        var intlOrders = orders.filter(function(order) {
            return order.geo.country != order.product.geo.country
        });

        if (intlOrders.length) {
            module.exports.emit('intl_orders', intlOrders);
            ordersStore.addIntlOrders(intlOrders);
        }
    });
});
