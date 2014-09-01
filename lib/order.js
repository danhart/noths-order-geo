var Order = function(orderData) {
    this.geo = orderData.geo;
    this.product = orderData.product;
    this.total = orderData.total;
    this.deliveryAddress = this.getDeliveryAddress();
    this.senderAddress = this.getSenderAddress();
    this.date = new Date();
};

Order.prototype.getDeliveryAddress = function() {
    var deliveryAddress = this.geo.place +
        ', ' +
        this.geo.county +
        ', ' +
        this.geo.country;

    deliveryAddress = deliveryAddress.replace(/ ,/, '');
    deliveryAddress = deliveryAddress.replace(/,,/, ',');

    return deliveryAddress;
};

Order.prototype.getSenderAddress = function() {
    var senderAddress = this.product.geo.place +
        ', ' +
        this.product.geo.county +
        ', ' +
        this.product.geo.country;

    senderAddress = senderAddress.replace(/ ,/, '');
    senderAddress = senderAddress.replace(/,,/, ',');

    return senderAddress;
};

module.exports = Order;
