var ordersService = require('./orders_service.js');
var io = require('socket.io').listen(10052);

io.sockets.on('connection', function (socket) {
    ordersService.on('orders', function(orders) {
        socket.emit('orders', orders);
    });
});
