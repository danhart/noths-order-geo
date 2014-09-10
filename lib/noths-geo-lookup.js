var geoLookup = require('./geo-lookup');

exports.lookup = function(order, callback) {
    geoLookup.getLocation(order.senderAddress, function(err, coordinate) {
        if (err || !coordinate) return callback(err, order);

        // TODO: We shouldn't mutate the model
        order.product.geo.coordinate = {
            lat: coordinate.lat,
            lon: coordinate.lng
        };

        geoLookup.getLocation(order.deliveryAddress, function(err, coordinate) {
            if (err || !coordinate) return callback(err, order);

            order.geo.coordinate = {
                lat: coordinate.lat,
                lon: coordinate.lng
            };

            callback(err, order);
        });
    });
};
