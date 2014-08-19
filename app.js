var ordersService = require('./orders_service.js');

var io = require('socket.io').listen(10052, {
    resource: '/noths_order_geo/socket.io'
});

io.sockets.on('connection', function (socket) {
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
