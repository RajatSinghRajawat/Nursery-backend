const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    shippingInfo: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        pincode: { type: Number, required: true },
        phoneNo: { type: Number, required: true },
    },
    orderitems: {
        name: { type: String, required: true },
        prices: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String, required: true },
        product: {
            type: mongoose.Schema.ObjectId,
            ref: "product",
            required: true,
        },
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "UserDetailsSignup",
        // required: true,
    },
    paymentInfo: {
        id: { type: String, required: true }, // Changed to String
        status: { type: String, required: true }, // Changed to String
    },
    paidAt: { type: Date, required: true },
    itemPrice: { type: Number, default: 0 },
    taxPrice: { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    orderStatus: {
        type: String,
        required: true,
        default: "Processing",
    },
    deliveredAt: { type: Date },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const ordersModel = mongoose.model('orders', orderSchema);

module.exports = ordersModel;
