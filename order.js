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

module.exports = Order;
