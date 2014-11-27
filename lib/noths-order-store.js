var EventEmitter = require('events').EventEmitter;
var util = require('util');
var async = require('async');
var NothsOrderCollection = require('./noths-order-collection');

var generateDateStamp = function(date) {
    return date.getDate() + "-" + date.getMonth() + "-" + date.getFullYear();
};

var NothsOrderStore = function(client) {
    EventEmitter.call(this);
    this.setMaxListeners(0);
    this.client = client;
    this.lastIdQueue = async.queue(this.lastIdWorker.bind(this), 1);
};

util.inherits(NothsOrderStore, EventEmitter);

NothsOrderStore.prototype.lastIdWorker = function(task, callback) {
    var self = this;

    this.client.get('lastOrderId', function (err, id) {
        if (!id) {
            self.client.set('lastOrderId', 1);
            return callback(null, 1);
        }

        self.client.incr('lastOrderId');
        callback(err, parseInt(id) + 1);
    });
};

NothsOrderStore.prototype.query = function(query, callback) {
    var self = this;

    var findOrders = function(err, orderIds) {
        // Sort IDs ASC
        orderIds = orderIds.sort(function(a, b){return a-b;});

        if (query.last) {
            orderIds = orderIds.slice(-query.last);
        }

        async.map(orderIds, function(orderId, callback) {
            self.client.get('order:' + orderId, function(err, order) {
                callback(err, JSON.parse(order));
            });
        }, function(err, orders) {
            callback(err, new NothsOrderCollection(orders));
        });
    };

    var sets = [];

    if (query.date) {
        sets.push('orders:' + generateDateStamp(new Date(query.date)));
    }

    if (query.origin) {
        sets.push('orders:' + query.origin);
    }

    if (query.international) {
        sets.push('orders:international');
    }

    if (sets.length) {
        sets.push(findOrders);
        this.client.sinter.apply(this.client, sets);
    } else {
        this.client.smembers('orders', findOrders);
    }
};

NothsOrderStore.prototype.push = function(order) {
    var self = this;

    this.lastIdQueue.push({}, function(err, id) {
        order.id = id;
        self.client.set('order:' + id, JSON.stringify(order));
        self.client.expire('order:' + id, 86400);

        self.client.sadd('orders', id);
        self.client.sadd('orders:' + generateDateStamp(new Date()), id);
        if (order.isOriginUK()) self.client.sadd('orders:uk', id);
        if (order.isOriginDE()) self.client.sadd('orders:de', id);
        if (order.isInternational()) self.client.sadd('orders:international', id);
        if (order.isDomestic()) self.client.sadd('orders:domestic', id);

        if (order.isOriginUK()) {
            self.client.incr('stats:uk:orders:' + generateDateStamp(new Date()));
            self.client.incrbyfloat('stats:uk:ttv:' + generateDateStamp(new Date()), order.total.amount);
        }

        if (order.isOriginDE()) {
            self.client.incr('stats:de:orders:' + generateDateStamp(new Date()));
            self.client.incrbyfloat('stats:de:ttv:' + generateDateStamp(new Date()), order.total.amount);
        }

        self.emit('order', order);
    });
};

NothsOrderStore.prototype.stats = function(callback) {
    var stats = {};
    var self = this;

    self.client.get('stats:uk:orders:' + generateDateStamp(new Date()), function(err, ukOrderCount) {
        if (err) return callback(err);
        stats.todaysUkOrderCount = ukOrderCount;

        self.client.get('stats:uk:ttv:' + generateDateStamp(new Date()), function(err, ukTtv) {
            if (err) return callback(err);
            stats.todaysUkTtv = ukTtv;

            self.client.get('stats:de:orders:' + generateDateStamp(new Date()), function(err, deOrderCount) {
                if (err) return callback(err);
                stats.todaysDeOrderCount = deOrderCount;

                self.client.get('stats:de:ttv:' + generateDateStamp(new Date()), function(err, deTtv) {
                    if (err) return callback(err);
                    stats.todaysDeTtv = deTtv;

                    callback(err, stats);
                });
            });
       });
    });
};

module.exports = NothsOrderStore;
