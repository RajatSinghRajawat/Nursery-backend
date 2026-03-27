const mongoose = require("mongoose");
const asyncHandler = require("../utils/asyncHandler");
const Sale = require("../models/salemodel");
const Product = require("../models/Productsmodel");
const Admin = require("../models/admin");

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

function buildSalesFilter(query = {}, user = {}) {
  const {
    from,
    to,
    productId,
    adminId,
  } = query || {};

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

  const isSuperAdmin = user?.role === "superadmin";
  if (!isSuperAdmin && user?.id && mongoose.Types.ObjectId.isValid(String(user.id))) {
    filter.adminId = String(user.id);
  }

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(String(from));
    if (to) filter.createdAt.$lte = new Date(String(to));
  }
  return filter;
}

// GET /sales?page=&limit=&from=&to=&productId=&adminId=
const listSales = asyncHandler(async (req, res) => {
  const {
    page = "1",
    limit = "20",
  } = req.query || {};

  const filter = buildSalesFilter(req.query, req.user);

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

// GET /sales/summary?from=&to=&productId=&adminId=
const salesSummary = asyncHandler(async (req, res) => {
  const filter = buildSalesFilter(req.query, req.user);

  const grouped = await Sale.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$adminId",
        totalQuantity: { $sum: { $ifNull: ["$quantity", 0] } },
        totalAmount: { $sum: { $ifNull: ["$totalAmount", 0] } },
        saleCount: { $sum: 1 },
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);

  const adminIds = grouped.map((row) => row._id).filter(Boolean);
  const admins = await Admin.find({ _id: { $in: adminIds } }).select("name email role");
  const adminById = new Map(admins.map((a) => [String(a._id), a]));

  const byAdmin = grouped.map((row) => {
    const admin = adminById.get(String(row._id));
    return {
      adminId: row._id,
      name: admin?.name || "",
      email: admin?.email || "Unknown",
      role: admin?.role || "",
      totalQuantity: Number(row.totalQuantity || 0),
      totalAmount: Number(row.totalAmount || 0),
      saleCount: Number(row.saleCount || 0),
    };
  });

  const totals = byAdmin.reduce(
    (acc, row) => {
      acc.totalQuantity += row.totalQuantity;
      acc.totalAmount += row.totalAmount;
      acc.saleCount += row.saleCount;
      return acc;
    },
    { totalQuantity: 0, totalAmount: 0, saleCount: 0 }
  );

  res.json({
    totals,
    byAdmin,
  });
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

module.exports = { createSale, listSales, getSale, salesSummary };