var nothsOrderFetcher = require('./lib/noths-order-fetcher.js');
var OrderCollection = require('./order-collection.js');
var Order = require('./order.js');

var orderCollection = new OrderCollection();

nothsOrderFetcher.on('order', function(orderData) {
    orderCollection.add(new Order(orderData));
});

var io = require('socket.io').listen(10052, {
    resource: '/noths_order_geo/socket.io',
    log: false
});

io.sockets.on('connection', function (socket) {
    console.log("Client connected");

    var orderListener = function(order) {
        socket.emit('order', order);
        socket.emit('stats', orderCollection.stats());
    };

    var intlOrderListener = function(intl_order) {
        socket.emit('intl_order', intl_order);
    };

    orderCollection.on('order', orderListener);
    orderCollection.on('intl-order', intlOrderListener);

    socket.on('stats', function() {
        socket.emit('stats', orderCollection.stats());
    });

    socket.on('orders', function(amount) {
        orderCollection.last(amount).forEach(function(order) {
            socket.emit('order', order);
        });
    });

    socket.on('order-query', function(query) {
        orderCollection.query(query).forEach(function(order) {
            socket.emit('order', order);
        });
    });

    socket.on('disconnect', function () {
        orderCollection.removeListener('order', orderListener);
        orderCollection.removeListener('intl-order', intlOrderListener);
    });
});
