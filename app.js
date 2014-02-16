var ordersService = require('./orders_service.js');
var io = require('socket.io').listen(10052);

io.sockets.on('connection', function (socket) {
    // Provides the last 10 intl orders immediately
    socket.emit('intl_orders', ordersService.intlOrders);

    var orderListener = function(orders) {
        socket.emit('orders', orders);
    };

    var intlOrderListener = function(intl_orders) {
        socket.emit('intl_orders', intl_orders);
    };

    ordersService.on('orders', orderListener);
    ordersService.on('intl_orders', intlOrderListener);

    socket.on('disconnect', function () {
        ordersService.removeListener('orders', orderListener);
        ordersService.removeListener('intl_orders', intlOrderListener);
    });
});
