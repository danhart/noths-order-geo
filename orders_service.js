var url = 'www.notonthehighstreet.com';
var fs = require('fs');
var http = require('http');
var EventEmitter = require('events').EventEmitter;

module.exports = new EventEmitter();
module.exports.intlOrders = [];

var last_order_id;

function getOrders(callback) {
    options = {
        hostname: url,
        path: "/map?last_order_id=" + last_order_id,
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

            if (data.products.length && last_order_id != data.last_order_id) {
                callback(data.products);
            }

            last_order_id = data.last_order_id;
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

loop(function(orders) {
    var intlOrders = orders.filter(function(order) {
        return order.geo.country != order.product.geo.country
    });

    if (intlOrders.length) {
        module.exports.intlOrders = module.exports.intlOrders.concat(intlOrders);
        module.exports.intlOrders = module.exports.intlOrders.splice(-10, 10);
        module.exports.emit('intl_orders', intlOrders);
    }

    module.exports.emit('orders', orders);
});
