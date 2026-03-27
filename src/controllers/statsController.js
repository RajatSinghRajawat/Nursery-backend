const Product = require("../models/Productsmodel");
const Category = require("../models/Categories");
const Order = require("../models/ordermodels");
const User = require("../models/User");
const Sale = require("../models/salemodel");
const asyncHandler = require("../utils/asyncHandler");

const dashboardStats = asyncHandler(async (_req, res) => {
  const [
    products,
    categories,
    orders,
    users,
    revenueAgg,
    salesCount,
    salesRevenueAgg,
  ] = await Promise.all([
    Product.countDocuments(),
    Category.countDocuments(),
    Order.countDocuments(),
    User.countDocuments(),
    Order.aggregate([
      { $match: { orderStatus: { $ne: "Cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]),
    Sale.countDocuments(),
    Sale.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
  ]);

  const revenue =
    revenueAgg && revenueAgg[0] && typeof revenueAgg[0].total === "number"
      ? revenueAgg[0].total
      : 0;

  const salesRevenue =
    salesRevenueAgg && salesRevenueAgg[0] && typeof salesRevenueAgg[0].total === "number"
      ? salesRevenueAgg[0].total
      : 0;

  res.json({
    products,
    categories,
    orders,
    users,
    revenue,
    salesCount,
    salesRevenue,
  });
});

module.exports = { dashboardStats };
