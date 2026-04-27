const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema({
    proposal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Proposal",
        required: true
    },

    receiptNumber: {
        type: String,
        unique: true
    },

    clientName: String,
    emailId: String,
    contactNumber: String,

    paymentMethod: {
        type: String,
        enum: ["Cash", "UPI", "Bank Transfer", "Card"],
        default: "UPI"
    },

    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid"],
        default: "Paid"
    },

    amountPaid: Number,

    note: String

}, { timestamps: true });

module.exports = mongoose.model("Receipt", receiptSchema);