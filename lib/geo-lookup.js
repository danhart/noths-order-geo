// A simple wrapper for the geocoder lib. Adds:
// - an in memory location cache
// - a throttle
// - a queue

var async = require('async');
var geocoder = require('geocoder');
var locationCache = {};

var getLocation = function(address, callback) {
    if (locationCache[address]) {
        callback(null, locationCache[address]);
        return;
    }

    if (locationCache[address] === null) {
        callback("cannot lookup address data");
        return;
    }

    geocoder.geocode(address, function (err, geoData) {
        if (err || !geoData.results[0]) {
            locationCache[address] = null;
            callback(err);
            return;
        }

        locationCache[address] = geoData.results[0].geometry.location;

        // We throttle the return of this otherwise google complains with a OVER_QUERY_LIMIT status
        setTimeout(function() {
            callback(null, locationCache[address]);
        }, 1000);
    });
};

var q = async.queue(getLocation, 1);

exports.getLocation = q.push;
