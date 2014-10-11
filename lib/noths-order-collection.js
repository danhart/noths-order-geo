var NothsOrderCollection = function(orders) {
    this.orders = orders;
};

NothsOrderCollection.prototype.add = function(order) {
    this.emit('order', order);
};

NothsOrderCollection.prototype.ttv = function() {
    // First remove any nulls (can be caused by redis LRU cache)
    var totals = this.orders.filter(function(e){return e});

    totals = this.orders.map(function(order) {
        return order.total;
    });

    return totals.reduce(function(ttv, total) {
        ttv[total.currency] += total.amount;
        return ttv;
    }, { USD: 0, GBP: 0, AUD: 0, EUR: 0});
};

NothsOrderCollection.prototype.count = function() {
    return this.orders.length;
};

NothsOrderCollection.prototype.forEach = function(callback) {
    this.orders.forEach(callback);
};

module.exports = NothsOrderCollection;
