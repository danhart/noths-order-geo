var ordersService = require('./orders_service.js');
var OrderCollection = require('./order-collection.js');

var orderCollection = new OrderCollection();

var io = require('socket.io').listen(10052, {
    resource: '/noths_order_geo/socket.io'
});

io.sockets.on('connection', function (socket) {
    var ordersListener = function(orders) {
        socket.emit('orders', orders);
    };

    var orderListener = function(order) {
        socket.emit('order', order);
        orderCollection.add(order);

        socket.emit('stats', {
            todaysTtv: orderCollection.today().ttv(),
            todaysTotalOrders: orderCollection.today().count()
        });
    };

    var intlOrdersListener = function(intl_orders) {
        socket.emit('intl_orders', intl_orders);
    };

    var intlOrderListener = function(intl_order) {
        socket.emit('intl_order', intl_order);
    };

    ordersService.on('orders', ordersListener);
    ordersService.on('order', orderListener);
    ordersService.on('intl_orders', intlOrdersListener);
    ordersService.on('intl_order', intlOrderListener);

    socket.on('disconnect', function () {
        ordersService.removeListener('orders', ordersListener);
        ordersService.removeListener('order', orderListener);
        ordersService.removeListener('intl_orders', intlOrdersListener);
        ordersService.removeListener('intl_order', intlOrderListener);
    });
});
