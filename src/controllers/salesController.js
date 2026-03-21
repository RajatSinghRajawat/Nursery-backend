const mongoose = require("mongoose");
const asyncHandler = require("../utils/asyncHandler");
const Sale = require("../models/salemodel");
const Product = require("../models/Productsmodel");

// POST /sales  (admin)
// body: { productId, quantity }
const createSale = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body || {};

  if (!productId || !mongoose.Types.ObjectId.isValid(String(productId))) {
    const err = new Error("productId is required");
    err.statusCode = 400;
    throw err;
  }

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    const err = new Error("quantity must be a positive number");
    err.statusCode = 400;
    throw err;
  }

  const adminId = req.user && req.user.id ? req.user.id : null;
  if (!adminId || !mongoose.Types.ObjectId.isValid(String(adminId))) {
    const err = new Error("Not authenticated");
    err.statusCode = 401;
    throw err;
  }

  const product = await Product.findById(productId);
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  if (typeof product.stock === "number" && product.stock < qty) {
    const err = new Error("Insufficient stock");
    err.statusCode = 400;
    throw err;
  }

  const unitPrice = Number(product.price || 0);
  const unitDiscount = Number(product.discount || 0);
  const effectiveUnit = Math.max(0, unitPrice - unitDiscount);
  const totalAmount = effectiveUnit * qty;

  // reduce stock
  product.stock = Number(product.stock || 0) - qty;
  await product.save();

  const sale = await Sale.create({
    productId,
    adminId,
    quantity: qty,
    totalAmount,
  });

  res.status(201).json(sale);
});

// GET /sales?page=&limit=&from=&to=&productId=&adminId=
const listSales = asyncHandler(async (req, res) => {
  const {
    page = "1",
    limit = "20",
    from,
    to,
    productId,
    adminId,
  } = req.query || {};

  const filter = {};

  if (productId) {
    if (!mongoose.Types.ObjectId.isValid(String(productId))) {
      const err = new Error("productId is invalid");
      err.statusCode = 400;
      throw err;
    }
    filter.productId = String(productId);
  }

  if (adminId) {
    if (!mongoose.Types.ObjectId.isValid(String(adminId))) {
      const err = new Error("adminId is invalid");
      err.statusCode = 400;
      throw err;
    }
    filter.adminId = String(adminId);
  }

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(String(from));
    if (to) filter.createdAt.$lte = new Date(String(to));
  }

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    Sale.find(filter)
      .populate("productId")
      .populate("adminId", "name email role isSuperAdmin")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Sale.countDocuments(filter),
  ]);

  res.json({ items, page: pageNum, limit: limitNum, total });
});

// GET /sales/:id
const getSale = asyncHandler(async (req, res) => {
  const { id } = req.params || {};
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid sale id");
    err.statusCode = 400;
    throw err;
  }

  const sale = await Sale.findById(id)
    .populate("productId")
    .populate("adminId", "name email role isSuperAdmin");

  if (!sale) {
    const err = new Error("Sale not found");
    err.statusCode = 404;
    throw err;
  }

  res.json(sale);
});

module.exports = { createSale, listSales, getSale };