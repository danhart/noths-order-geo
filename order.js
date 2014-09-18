var Order = function(data) {
    this.geo = data.geo;
    this.product = data.product;
    this.total = data.total;
    this.deliveryAddress = data.deliveryAddress;
    this.senderAddress = data.senderAddress;
    this.date = data.date;
    this.origin = data.origin;
};

Order.prototype.isDomestic = function() {
    return this.geo.country === this.product.geo.country;
};

Order.prototype.isInternational = function() {
    return !this.isDomestic();
};

Order.prototype.isOriginUK = function() {
    return this.origin.match(/\.com$/);
};

Order.prototype.isOriginDE = function() {
    return this.origin.match(/\.de$/);
};

module.exports = Order;
