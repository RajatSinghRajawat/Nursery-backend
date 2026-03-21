const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema({

  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  },

  quantity: Number,

  totalAmount: Number,

}, { timestamps: true });

const Sale = mongoose.model("Sale", saleSchema);

module.exports = Sale;