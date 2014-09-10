var geoLookup = require('./geo-lookup');
var async = require('async');

exports.lookup = function(order, callback) {
    async.map([order.senderAddress, order.deliveryAddress], geoLookup.getLocation.bind(geoLookup), function(err, coordinates) {
        if (err || !coordinates[0] || !coordinates[1]) {
            console.log(err);

            // Even if we can't fetch coordinates, we should still return the
            // original order to avoid losing it entirely
            callback(null, order);
            return;
        }

        // TODO: We shouldn't mutate the model
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
