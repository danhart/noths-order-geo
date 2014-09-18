var util = require('util');
var redis = require('redis');
var nothsOrderFetcher = require('./lib/noths-order-fetcher');
var nothsGeoLookup = require('./lib/noths-geo-lookup');
var Order = require('./order');
var NothsOrderStore = require('./lib/noths-order-store');

var nothsOrderStore = new NothsOrderStore(redis.createClient());

nothsOrderFetcher.on('order', function(orderData) {
    var order = new Order(orderData);

    if (order.isInternational()) {
        util.log("International order");
        // Would like to do this for all orders but Google limit to 2,500
        // requests per day per IP. So just international orders for now.
        nothsGeoLookup.lookup(order, function(err, orderWithGeo) {
            util.log(util.inspect(order.product.geo.coordinate, { colors: true }));
            util.log(util.inspect(order.geo.coordinate, { colors: true }));

            if (err) util.log(err);
            nothsOrderStore.push(orderWithGeo);
        });
    } else {
        nothsOrderStore.push(order);
    }
});

var io = require('socket.io').listen(10052, {
    resource: '/noths_order_geo/socket.io',
    log: false
});

io.sockets.on('connection', function (socket) {
    util.log("Client connected");

    var orderListener = function(order) {
        socket.emit('order', order);

        nothsOrderStore.stats(function(stats) {
            socket.emit('stats', stats);
        });
    };

    nothsOrderStore.on('order', orderListener);

    socket.on('stats', function() {
        nothsOrderStore.stats(function(stats) {
            socket.emit('stats', stats);
        });
    });

    socket.on('order-query', function(query) {
        try {
            nothsOrderStore.query(query, function(orders) {
                orders.forEach(function(order) {
                    socket.emit('order', order);
                });
            });
        } catch (e) {
            socket.emit('order-query-error', util.inspect(e));
            util.error(e);
        }
    });

    socket.on('disconnect', function () {
        nothsOrderStore.removeListener('order', orderListener);
    });
});
