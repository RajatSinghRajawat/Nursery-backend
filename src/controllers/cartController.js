const mongoose = require("mongoose");
const Cart = require("../models/cartmodel");
const Product = require("../models/Productsmodel");
const asyncHandler = require("../utils/asyncHandler");
const { effectiveSellingUnit } = require("../utils/productPricing");

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, Products: [], totalPrice: 0 });
  }
  return cart;
}

async function recalcTotal(cart) {
  let total = 0;
  for (const line of cart.Products || []) {
    const p = await Product.findById(line.productId).select(
      "price discount discountType isActive"
    );
    if (p && p.isActive !== false) {
      total += effectiveSellingUnit(p) * line.quantity;
    }
  }
  cart.totalPrice = total;
  await cart.save();
  return cart;
}

const getCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cart = await getOrCreateCart(userId);
  await cart.populate({
    path: "Products.productId",
    select:
      "name sku price discount discountType mrp image mainImage shortDescription stock stockStatus isActive description soldBy categoryId",
    populate: { path: "categoryId", select: "name slug" },
  });
  res.json(cart);
});

const addOrUpdateItem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity = 1 } = req.body || {};
  if (!productId || !mongoose.Types.ObjectId.isValid(String(productId))) {
    const err = new Error("Valid productId is required");
    err.statusCode = 400;
    throw err;
  }
  const qty = Math.max(1, parseInt(String(quantity), 10) || 1);
  const product = await Product.findById(productId);
  if (!product || product.isActive === false) {
    const err = new Error("Product not available");
    err.statusCode = 404;
    throw err;
  }
  if (product.stock < qty) {
    const err = new Error("Insufficient stock");
    err.statusCode = 400;
    throw err;
  }

  const cart = await getOrCreateCart(userId);
  const lines = cart.Products || [];
  const idx = lines.findIndex(
    (l) => String(l.productId) === String(productId)
  );
  if (idx >= 0) {
    const nextQty = lines[idx].quantity + qty;
    if (product.stock < nextQty) {
      const err = new Error("Insufficient stock");
      err.statusCode = 400;
      throw err;
    }
    lines[idx].quantity = nextQty;
  } else {
    lines.push({ productId, quantity: qty });
  }
  cart.Products = lines;
  await cart.save();
  await recalcTotal(cart);
  await cart.populate({
    path: "Products.productId",
    select:
      "name sku price discount discountType mrp image mainImage shortDescription stock stockStatus isActive description soldBy categoryId",
    populate: { path: "categoryId", select: "name slug" },
  });
  res.json(cart);
});

const setItemQuantity = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  const { quantity } = req.body || {};
  if (!productId || !mongoose.Types.ObjectId.isValid(String(productId))) {
    const err = new Error("Invalid productId");
    err.statusCode = 400;
    throw err;
  }
  const qty = parseInt(String(quantity), 10);
  if (Number.isNaN(qty) || qty < 0) {
    const err = new Error("quantity must be a non-negative integer");
    err.statusCode = 400;
    throw err;
  }

  const cart = await getOrCreateCart(userId);
  let lines = cart.Products || [];
  if (qty === 0) {
    lines = lines.filter((l) => String(l.productId) !== String(productId));
  } else {
    const product = await Product.findById(productId);
    if (!product || product.isActive === false) {
      const err = new Error("Product not available");
      err.statusCode = 404;
      throw err;
    }
    if (product.stock < qty) {
      const err = new Error("Insufficient stock");
      err.statusCode = 400;
      throw err;
    }
    const idx = lines.findIndex(
      (l) => String(l.productId) === String(productId)
    );
    if (idx >= 0) lines[idx].quantity = qty;
    else lines.push({ productId, quantity: qty });
  }
  cart.Products = lines;
  await cart.save();
  await recalcTotal(cart);
  await cart.populate({
    path: "Products.productId",
    select:
      "name sku price discount discountType mrp image mainImage shortDescription stock stockStatus isActive description soldBy categoryId",
    populate: { path: "categoryId", select: "name slug" },
  });
  res.json(cart);
});

const removeItem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  if (!productId || !mongoose.Types.ObjectId.isValid(String(productId))) {
    const err = new Error("Invalid productId");
    err.statusCode = 400;
    throw err;
  }
  const cart = await getOrCreateCart(userId);
  cart.Products = (cart.Products || []).filter(
    (l) => String(l.productId) !== String(productId)
  );
  await cart.save();
  await recalcTotal(cart);
  await cart.populate({
    path: "Products.productId",
    select:
      "name sku price discount discountType mrp image mainImage shortDescription stock stockStatus isActive description soldBy categoryId",
    populate: { path: "categoryId", select: "name slug" },
  });
  res.json(cart);
});

const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cart = await getOrCreateCart(userId);
  cart.Products = [];
  cart.totalPrice = 0;
  await cart.save();
  res.json(cart);
});

module.exports = {
  getCart,
  addOrUpdateItem,
  setItemQuantity,
  removeItem,
  clearCart,
};
