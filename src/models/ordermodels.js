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
    orderItems: [
        {
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
            image: { type: String },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
        },
    ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    paymentInfo: {
        id: { type: String, default: "" },
        status: { type: String, default: "" },
    },
    paidAt: { type: Date },
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
