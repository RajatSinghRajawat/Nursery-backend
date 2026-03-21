const mongoose = require("mongoose");
const Product = require("../models/Productsmodel");
const asyncHandler = require("../utils/asyncHandler");

const pickDefined = (obj) => {
  const out = {};
  Object.keys(obj).forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
};

// POST /products/add (admin)
const productadd = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    discount,
    soldBy,
    responseRate,
    categoryId,
    description,
    image,
    stock,
    isActive,
  } = req.body || {};

  if (!name || typeof name !== "string") {
    const err = new Error("name is required");
    err.statusCode = 400;
    throw err;
  }
  if (price === undefined || Number.isNaN(Number(price))) {
    const err = new Error("price is required");
    err.statusCode = 400;
    throw err;
  }
  if (!soldBy || typeof soldBy !== "string") {
    const err = new Error("soldBy is required");
    err.statusCode = 400;
    throw err;
  }
  if (!description || typeof description !== "string") {
    const err = new Error("description is required");
    err.statusCode = 400;
    throw err;
  }
  if (!Array.isArray(image) || image.length === 0) {
    const err = new Error("image must be a non-empty array of strings");
    err.statusCode = 400;
    throw err;
  }
  if (stock === undefined || Number.isNaN(Number(stock))) {
    const err = new Error("stock is required");
    err.statusCode = 400;
    throw err;
  }
  if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
    const err = new Error("categoryId is invalid");
    err.statusCode = 400;
    throw err;
  }

  const created = await Product.create({
    user: req.user && req.user.id ? req.user.id : undefined,
    name: String(name).trim(),
    price: Number(price),
    discount: discount === undefined ? undefined : Number(discount),
    soldBy: String(soldBy).trim(),
    responseRate: responseRate === undefined ? undefined : Number(responseRate),
    categoryId: categoryId || undefined,
    description: String(description).trim(),
    image,
    stock: Number(stock),
    isActive: isActive === undefined ? undefined : Boolean(isActive),
  });

  res.status(201).json(created);
});

// GET /products?search=&categoryId=&active=&minPrice=&maxPrice=&page=&limit=
const listProducts = asyncHandler(async (req, res) => {
  const {
    search,
    categoryId,
    active,
    minPrice,
    maxPrice,
    page = "1",
    limit = "20",
  } = req.query || {};

  const filter = {};

  if (search) {
    filter.name = { $regex: String(search), $options: "i" };
  }
  if (categoryId) {
    if (!mongoose.Types.ObjectId.isValid(String(categoryId))) {
      const err = new Error("categoryId is invalid");
      err.statusCode = 400;
      throw err;
    }
    filter.categoryId = String(categoryId);
  }
  if (active !== undefined) {
    const v = String(active).toLowerCase();
    if (v === "true" || v === "1") filter.isActive = true;
    else if (v === "false" || v === "0") filter.isActive = false;
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined && !Number.isNaN(Number(minPrice))) {
      filter.price.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined && !Number.isNaN(Number(maxPrice))) {
      filter.price.$lte = Number(maxPrice);
    }
    if (Object.keys(filter.price).length === 0) delete filter.price;
  }

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({
    items,
    page: pageNum,
    limit: limitNum,
    total,
  });
});

// GET /products/:id
const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params || {};
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid product id");
    err.statusCode = 400;
    throw err;
  }

  const product = await Product.findById(id);
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  res.json(product);
});

// PUT /products/:id (admin)
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params || {};
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid product id");
    err.statusCode = 400;
    throw err;
  }

  const {
    name,
    price,
    discount,
    soldBy,
    responseRate,
    categoryId,
    description,
    image,
    stock,
    isActive,
  } = req.body || {};

  if (categoryId !== undefined && categoryId !== null && categoryId !== "") {
    if (!mongoose.Types.ObjectId.isValid(String(categoryId))) {
      const err = new Error("categoryId is invalid");
      err.statusCode = 400;
      throw err;
    }
  }

  const update = pickDefined({
    name: name === undefined ? undefined : String(name).trim(),
    price: price === undefined ? undefined : Number(price),
    discount: discount === undefined ? undefined : Number(discount),
    soldBy: soldBy === undefined ? undefined : String(soldBy).trim(),
    responseRate:
      responseRate === undefined ? undefined : Number(responseRate),
    categoryId:
      categoryId === undefined || categoryId === null || categoryId === ""
        ? undefined
        : String(categoryId),
    description:
      description === undefined ? undefined : String(description).trim(),
    image: image === undefined ? undefined : image,
    stock: stock === undefined ? undefined : Number(stock),
    isActive: isActive === undefined ? undefined : Boolean(isActive),
  });

  const updated = await Product.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  res.json(updated);
});

module.exports = { productadd, listProducts, getProduct, updateProduct };