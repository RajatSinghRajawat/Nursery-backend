const mongoose = require("mongoose");
const Order = require("../models/ordermodels");
const Cart = require("../models/cartmodel");
const Product = require("../models/Productsmodel");
const asyncHandler = require("../utils/asyncHandler");
const { effectiveSellingUnit } = require("../utils/productPricing");

const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { shippingInfo } = req.body || {};
  if (!shippingInfo || typeof shippingInfo !== "object") {
    const err = new Error("shippingInfo is required");
    err.statusCode = 400;
    throw err;
  }
  const { address, city, state, country, pincode, phoneNo } = shippingInfo;
  if (!address || !city || !state || !country || pincode == null || phoneNo == null) {
    const err = new Error(
      "shippingInfo must include address, city, state, country, pincode, phoneNo"
    );
    err.statusCode = 400;
    throw err;
  }

  const cart = await Cart.findOne({ userId });
  if (!cart || !cart.Products || cart.Products.length === 0) {
    const err = new Error("Cart is empty");
    err.statusCode = 400;
    throw err;
  }

  const orderItems = [];
  let itemPrice = 0;

  for (const line of cart.Products) {
    const product = await Product.findById(line.productId);
    if (!product || product.isActive === false) {
      const err = new Error(`Product unavailable: ${line.productId}`);
      err.statusCode = 400;
      throw err;
    }
    if (product.stock < line.quantity) {
      const err = new Error(`Insufficient stock for ${product.name}`);
      err.statusCode = 400;
      throw err;
    }
    const unit = effectiveSellingUnit(product);
    const lineTotal = unit * line.quantity;
    itemPrice += lineTotal;
    const img =
      Array.isArray(product.image) && product.image.length
        ? product.image[0]
        : "";
    orderItems.push({
      name: product.name,
      price: unit,
      quantity: line.quantity,
      image: img,
      product: product._id,
    });
  }

  const taxPrice = 0;
  const shippingPrice = 0;
  const totalPrice = itemPrice + taxPrice + shippingPrice;

  const order = await Order.create({
    shippingInfo: {
      address: String(address),
      city: String(city),
      state: String(state),
      country: String(country),
      pincode: Number(pincode),
      phoneNo: Number(phoneNo),
    },
    orderItems,
    user: userId,
    itemPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    orderStatus: "Processing",
    paymentInfo: { id: "", status: "pending" },
  });

  for (const line of cart.Products) {
    await Product.findByIdAndUpdate(line.productId, {
      $inc: { stock: -line.quantity },
    });
  }

  cart.Products = [];
  cart.totalPrice = 0;
  await cart.save();

  res.status(201).json(order);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
  res.json({ items: orders });
});

const getOrderById = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid order id");
    err.statusCode = 400;
    throw err;
  }
  const order = await Order.findById(id);
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }
  if (String(order.user) !== String(userId)) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
  res.json(order);
});

const listAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10) || 20));
  const skip = (page - 1) * limit;
  const status = req.query.status;
  const filter = {};
  if (status) filter.orderStatus = String(status);

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name firstName email"),
    Order.countDocuments(filter),
  ]);

  res.json({ items, page, limit, total });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orderStatus } = req.body || {};
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid order id");
    err.statusCode = 400;
    throw err;
  }
  const allowed = ["Processing", "Shipped", "Delivered", "Cancelled"];
  if (!orderStatus || !allowed.includes(String(orderStatus))) {
    const err = new Error(`orderStatus must be one of: ${allowed.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }
  const order = await Order.findById(id);
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }
  order.orderStatus = orderStatus;
  if (orderStatus === "Delivered") {
    order.deliveredAt = new Date();
  }
  await order.save();
  res.json(order);
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  listAllOrders,
  updateOrderStatus,
};
