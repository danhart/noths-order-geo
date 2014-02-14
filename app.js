var url = 'www.notonthehighstreet.com';
var fs = require('fs');
var http = require('http');
var last_order_id;

// data: { last_order_id: this.last_order_id },
function getOrders(callback) {
    options = {
        hostname: url,
        path: "/map?last_order_id=" + last_order_id,
        headers: {
            'Content-Type':     'application/json',
            'Accept':           'application/json, text/javascript',
            'X-Requested-With': 'XMLHttpRequest'
        }
    }

    http.get(options, function(res) {
        var body = '';

        res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('end', function() {
            var data = JSON.parse(body)
            last_order_id = data.last_order_id;
            callback(data.products);
        });
    }).on('error', function(e) {
          console.log("Got error: ", e);
    });
}

function loop() {
    var orders = [];

    setInterval(function() {
        getOrders(function(newOrders) {
            orders = orders.concat(newOrders);
            orders = orders.slice(-20);

            // Write to disk
            fs.writeFile("/tmp/orders.json", JSON.stringify(orders), function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log("Orders updated.");
                }
            });
        });
    }, 5000);
}

loop();
