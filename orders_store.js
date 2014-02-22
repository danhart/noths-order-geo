var fs = require('fs');

var INTL_ORDERS_FILE = "./intl_orders.json";
var ORDERS_FILE = "./orders.json";
var LAST_ORDER_ID_FILE = "./last_order_id";
var ORDERS_TO_STORE = 500;

var getDataFor = function(filename) {
    if (fs.existsSync(filename)) {
        return JSON.parse(fs.readFileSync(filename));
    } else {
        return [];
    }
};

var getLastOrderId = function() {
    if (fs.existsSync(LAST_ORDER_ID_FILE)) {
        return fs.readFileSync(LAST_ORDER_ID_FILE);
    } else {
        return null;
    }
};

exports.intlOrders = getDataFor(INTL_ORDERS_FILE);
exports.orders = getDataFor(ORDERS_FILE);
exports.lastOrderId = getLastOrderId();

exports.addOrders = function(newOrders) {
    exports.orders = exports.orders.concat(newOrders);
    exports.orders = exports.orders.splice(-ORDERS_TO_STORE, ORDERS_TO_STORE);
    fs.writeFile(ORDERS_FILE, JSON.stringify(exports.orders));
};

exports.addIntlOrders = function(newIntlOrders) {
    exports.intlOrders = exports.intlOrders.concat(newIntlOrders);
    exports.intlOrders = exports.intlOrders.splice(-ORDERS_TO_STORE, ORDERS_TO_STORE);
    fs.writeFile(INTL_ORDERS_FILE, JSON.stringify(exports.intlOrders));
};

exports.setLastOrderId = function(lastOrderId) {
    exports.lastOrderId = lastOrderId;
    fs.writeFile(LAST_ORDER_ID_FILE, exports.lastOrderId);
};
