var OrderCollection = function(orders) {
    this.orders = orders || [];
    this.ordersByDate = {};
};

OrderCollection.prototype.add = function(order) {
    this.orders.push(order);
    this.addToDate(order);
};

OrderCollection.prototype.addToDate = function(order) {
    var dateStamp = generateDateStamp(order.date);

    if (!this.ordersByDate[dateStamp]) {
        this.ordersByDate[dateStamp] = [];
    }

    this.ordersByDate[dateStamp].push(order);
};

OrderCollection.prototype.ttv = function() {
    var totals = this.orders.map(function(order) {
        return order.total;
    });

    return totals.reduce(function(ttv, total) {
        ttv[total.currency] += total.amount;
        return ttv;
    }, { USD: 0, GBP: 0, AUD: 0, EUR: 0});
};

OrderCollection.prototype.today = function() {
    return this.byDate(new Date());
};

OrderCollection.prototype.count = function() {
    return this.orders.length;
};

OrderCollection.prototype.byDate = function(date) {
    var dateStamp = generateDateStamp(date);
    return new OrderCollection(this.ordersByDate[dateStamp]);
};

OrderCollection.prototype.byOrigin = function(origin) {
    return new OrderCollection(this.orders.filter(function(order) {
        return order.origin === origin;
    }));
};

OrderCollection.prototype.last = function(amount) {
    var amount = amount || 1;
    return new OrderCollection(this.orders.slice(-amount));
};

OrderCollection.prototype.query = function(query) {
    var collection = this;

    if (query.date) collection = collection.byDate(query.date);
    if (query.origin) collection = collection.byOrigin(query.origin);
    if (query.last) collection = collection.last(query.last);

    return collection;
};

OrderCollection.prototype.forEach = function(callback) {
    this.orders.forEach(callback);
};

var generateDateStamp = function(date) {
    return date.getDate() + "-" + date.getMonth() + "-" + date.getFullYear();
};

module.exports = OrderCollection;
