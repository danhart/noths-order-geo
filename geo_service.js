var geocoder = require('geocoder');
var locationCache = {};

var makeApiRequest = function(address, callback) {
    options = {
        hostname: "http://maps.googleapis.com",
        path: "/maps/api/geocode/json?address=" + "moo" + "&sensor=false"
    };

    http.get(options, function(res) {
        var body = '';

        res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('end', function() {
            console.log(options);
            console.log(body);
            // var data = JSON.parse(body);

            // callback(data.results, data.status);
        });
    }).on('error', function(e) {
        console.log("Got error: ", e);
    });
};

exports.getLocation = function(address, callback) {
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
