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

function normalizeSku(v) {
  if (v === undefined || v === null) return undefined;
  return String(v).trim().toUpperCase();
}

function buildGalleryFromBody(body) {
  const {
    mainImage,
    additionalImages,
    lifestyleImages,
    image,
  } = body || {};
  const out = [];
  const push = (u) => {
    const s = typeof u === "string" ? u.trim() : "";
    if (s && !out.includes(s)) out.push(s);
  };
  if (mainImage) push(mainImage);
  if (Array.isArray(additionalImages)) additionalImages.forEach((u) => push(u));
  if (Array.isArray(lifestyleImages)) lifestyleImages.forEach((u) => push(u));
  if (Array.isArray(image)) image.forEach((u) => push(u));
  return out;
}

function syncDescriptions(body) {
  const shortDescription =
    body.shortDescription !== undefined
      ? String(body.shortDescription).trim()
      : undefined;
  let detailed =
    body.detailedDescription !== undefined
      ? String(body.detailedDescription).trim()
      : undefined;
  let legacy =
    body.description !== undefined ? String(body.description).trim() : undefined;

  if (detailed === undefined && legacy !== undefined) detailed = legacy;
  if (legacy === undefined && detailed !== undefined) legacy = detailed;

  return { shortDescription, detailedDescription: detailed, description: legacy };
}

function parseSubcategoriesText(input) {
  if (input === undefined || input === null) return undefined;
  const raw = typeof input === "string" ? input : Array.isArray(input) ? input.join("\n") : String(input);
  const lines = raw
    .split(/\r?\n|,/g)
    .map((s) => String(s).trim())
    .filter(Boolean);
  // Deduplicate while preserving order
  const seen = new Set();
  const out = [];
  for (const name of lines) {
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(name);
    }
  }
  return out;
}

const productadd = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const {
    name,
    sku,
    price,
    discount,
    discountType,
    soldBy,
    responseRate,
    categoryId,
    subcategoriesText,
    highlights,
    plantType,
    botanicalName,
    commonName,
    heightValue,
    heightUnit,
    heightLabel,
    plantAge,
    mrp,
    gstPercent,
    stock,
    stockStatus,
    minOrderQty,
    growthType,
    sunlightRequirement,
    wateringSchedule,
    soilType,
    maintenanceLevel,
    airPurifying,
    floweringType,
    seasonalAvailability,
    mainImage,
    additionalImages,
    lifestyleImages,
    videoUrl,
    seoTitle,
    metaTitle,
    metaDescription,
    metaKeywords,
    slug,
    reviewsEnabled,
    isActive,
  } = body;

  if (!name || typeof name !== "string") {
    const err = new Error("name is required");
    err.statusCode = 400;
    throw err;
  }
  const skuNorm = normalizeSku(sku);
  if (!skuNorm) {
    const err = new Error("sku is required (unique product code)");
    err.statusCode = 400;
    throw err;
  }
  const dupSku = await Product.findOne({ sku: skuNorm });
  if (dupSku) {
    const err = new Error("SKU already exists");
    err.statusCode = 409;
    throw err;
  }
  if (price === undefined || Number.isNaN(Number(price))) {
    const err = new Error("price (selling price) is required");
    err.statusCode = 400;
    throw err;
  }
  const soldByVal =
    soldBy !== undefined && soldBy !== null && String(soldBy).trim()
      ? String(soldBy).trim()
      : "Nursery";

  const { shortDescription, detailedDescription, description } = syncDescriptions(body);
  if (
    !detailedDescription &&
    !description &&
    !(shortDescription && shortDescription.length >= 10)
  ) {
    const err = new Error(
      "Provide shortDescription (min ~10 chars) and/or detailedDescription"
    );
    err.statusCode = 400;
    throw err;
  }

  const gallery = buildGalleryFromBody(body);
  if (gallery.length === 0) {
    const err = new Error(
      "At least one image is required (mainImage, additionalImages, lifestyleImages, or image[])"
    );
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

  const doc = {
    user: req.user && req.user.id ? req.user.id : undefined,
    name: String(name).trim(),
    sku: skuNorm,
    slug: slug ? String(slug).toLowerCase().trim() : undefined,
    categoryId: categoryId || undefined,
    subcategoriesText:
      subcategoriesText === undefined
        ? undefined
        : parseSubcategoriesText(subcategoriesText) || [],
    shortDescription: shortDescription ?? "",
    detailedDescription: detailedDescription ?? description ?? "",
    description: description ?? detailedDescription ?? "",
    highlights: Array.isArray(highlights) ? highlights.map((h) => String(h).trim()).filter(Boolean) : [],
    plantType: plantType === undefined ? "" : String(plantType).trim(),
    botanicalName: botanicalName === undefined ? "" : String(botanicalName).trim(),
    commonName: commonName === undefined ? "" : String(commonName).trim(),
    heightValue: heightValue === undefined ? undefined : Number(heightValue),
    heightUnit: heightUnit || "cm",
    heightLabel: heightLabel === undefined ? "" : String(heightLabel).trim(),
    plantAge: plantAge === undefined ? "" : String(plantAge).trim(),
    mrp: mrp === undefined ? Number(price) : Number(mrp),
    price: Number(price),
    discount: discount === undefined ? 0 : Number(discount),
    discountType: discountType || "amount",
    gstPercent: gstPercent === undefined ? 0 : Number(gstPercent),
    stock: Number(stock),
    stockStatus: stockStatus || "in_stock",
    minOrderQty: minOrderQty === undefined ? 1 : Math.max(1, Number(minOrderQty)),
    growthType: growthType === undefined ? "" : String(growthType).trim(),
    sunlightRequirement:
      sunlightRequirement === undefined ? "" : String(sunlightRequirement).trim(),
    wateringSchedule:
      wateringSchedule === undefined ? "" : String(wateringSchedule).trim(),
    soilType: soilType === undefined ? "" : String(soilType).trim(),
    maintenanceLevel:
      maintenanceLevel === undefined ? "" : String(maintenanceLevel).trim(),
    airPurifying: Boolean(airPurifying),
    floweringType: floweringType || "NA",
    seasonalAvailability:
      seasonalAvailability === undefined ? "" : String(seasonalAvailability).trim(),
    mainImage: mainImage ? String(mainImage).trim() : gallery[0],
    additionalImages: Array.isArray(additionalImages)
      ? additionalImages.map((u) => String(u).trim()).filter(Boolean)
      : [],
    lifestyleImages: Array.isArray(lifestyleImages)
      ? lifestyleImages.map((u) => String(u).trim()).filter(Boolean)
      : [],
    videoUrl: videoUrl === undefined ? "" : String(videoUrl).trim(),
    image: gallery,
    seoTitle: seoTitle === undefined ? "" : String(seoTitle).trim(),
    metaTitle: metaTitle === undefined ? "" : String(metaTitle).trim(),
    metaDescription: metaDescription === undefined ? "" : String(metaDescription).trim(),
    metaKeywords: Array.isArray(metaKeywords)
      ? metaKeywords.map((k) => String(k).trim()).filter(Boolean)
      : [],
    reviewsEnabled: reviewsEnabled === undefined ? true : Boolean(reviewsEnabled),
    soldBy: soldByVal,
    responseRate: responseRate === undefined ? undefined : Number(responseRate),
    isActive: isActive === undefined ? true : Boolean(isActive),
  };

  const created = await Product.create(doc);
  res.status(201).json(created);
});

const listProducts = asyncHandler(async (req, res) => {
  const {
    search,
    categoryId,
    active,
    minPrice,
    maxPrice,
    stockStatus,
    slug,
    page = "1",
    limit = "20",
  } = req.query || {};

  const filter = {};

  if (slug) {
    filter.slug = String(slug).toLowerCase();
  }
  if (search) {
    const q = String(search).trim();
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { sku: { $regex: q, $options: "i" } },
      { commonName: { $regex: q, $options: "i" } },
      { botanicalName: { $regex: q, $options: "i" } },
    ];
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
  if (stockStatus) {
    filter.stockStatus = String(stockStatus);
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
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("categoryId", "name slug kind plantSegment coverImage description isActive"),
    Product.countDocuments(filter),
  ]);

  res.json({
    items,
    page: pageNum,
    limit: limitNum,
    total,
  });
});

const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params || {};
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid product id");
    err.statusCode = 400;
    throw err;
  }

  const product = await Product.findById(id).populate(
    "categoryId",
    "name slug kind plantSegment description coverImage"
  );
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  res.json(product);
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || "").toLowerCase().trim();
  if (!slug) {
    const err = new Error("Slug required");
    err.statusCode = 400;
    throw err;
  }
  const product = await Product.findOne({ slug }).populate(
    "categoryId",
    "name slug kind plantSegment description coverImage"
  );
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }
  res.json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params || {};
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid product id");
    err.statusCode = 400;
    throw err;
  }

  const body = req.body || {};
  const {
    name,
    sku,
    price,
    discount,
    discountType,
    soldBy,
    responseRate,
    categoryId,
    subcategoriesText,
    highlights,
    plantType,
    botanicalName,
    commonName,
    heightValue,
    heightUnit,
    heightLabel,
    plantAge,
    mrp,
    gstPercent,
    stock,
    stockStatus,
    minOrderQty,
    growthType,
    sunlightRequirement,
    wateringSchedule,
    soilType,
    maintenanceLevel,
    airPurifying,
    floweringType,
    seasonalAvailability,
    mainImage,
    additionalImages,
    lifestyleImages,
    videoUrl,
    seoTitle,
    metaTitle,
    metaDescription,
    metaKeywords,
    slug,
    reviewsEnabled,
    isActive,
  } = body;

  if (categoryId !== undefined && categoryId !== null && categoryId !== "") {
    if (!mongoose.Types.ObjectId.isValid(String(categoryId))) {
      const err = new Error("categoryId is invalid");
      err.statusCode = 400;
      throw err;
    }
  }

  let skuNorm;
  if (sku !== undefined) {
    skuNorm = normalizeSku(sku);
    if (skuNorm) {
      const dup = await Product.findOne({ sku: skuNorm, _id: { $ne: id } });
      if (dup) {
        const err = new Error("SKU already in use");
        err.statusCode = 409;
        throw err;
      }
    }
  }

  const desc = syncDescriptions(body);

  const product = await Product.findById(id);
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  let gallery;
  if (
    mainImage !== undefined ||
    additionalImages !== undefined ||
    lifestyleImages !== undefined ||
    body.image !== undefined
  ) {
    const merged = {
      mainImage:
        mainImage !== undefined ? mainImage : product.mainImage,
      additionalImages:
        additionalImages !== undefined
          ? additionalImages
          : product.additionalImages,
      lifestyleImages:
        lifestyleImages !== undefined
          ? lifestyleImages
          : product.lifestyleImages,
      image: body.image !== undefined ? body.image : product.image,
    };
    gallery = buildGalleryFromBody(merged);
  }

  const update = pickDefined({
    name: name === undefined ? undefined : String(name).trim(),
    sku: skuNorm,
    slug: slug === undefined ? undefined : String(slug).toLowerCase().trim(),
    price: price === undefined ? undefined : Number(price),
    discount: discount === undefined ? undefined : Number(discount),
    discountType: discountType === undefined ? undefined : discountType,
    soldBy: soldBy === undefined ? undefined : String(soldBy).trim(),
    responseRate: responseRate === undefined ? undefined : Number(responseRate),
    categoryId:
      categoryId === undefined || categoryId === null || categoryId === ""
        ? undefined
        : String(categoryId),
    subcategoriesText:
      subcategoriesText === undefined
        ? undefined
        : parseSubcategoriesText(subcategoriesText) || [],
    shortDescription: desc.shortDescription,
    detailedDescription: desc.detailedDescription,
    description: desc.description,
    highlights: highlights === undefined ? undefined : highlights,
    plantType: plantType === undefined ? undefined : String(plantType).trim(),
    botanicalName:
      botanicalName === undefined ? undefined : String(botanicalName).trim(),
    commonName: commonName === undefined ? undefined : String(commonName).trim(),
    heightValue: heightValue === undefined ? undefined : Number(heightValue),
    heightUnit: heightUnit === undefined ? undefined : heightUnit,
    heightLabel: heightLabel === undefined ? undefined : String(heightLabel).trim(),
    plantAge: plantAge === undefined ? undefined : String(plantAge).trim(),
    mrp: mrp === undefined ? undefined : Number(mrp),
    gstPercent: gstPercent === undefined ? undefined : Number(gstPercent),
    stock: stock === undefined ? undefined : Number(stock),
    stockStatus: stockStatus === undefined ? undefined : stockStatus,
    minOrderQty: minOrderQty === undefined ? undefined : Math.max(1, Number(minOrderQty)),
    growthType: growthType === undefined ? undefined : String(growthType).trim(),
    sunlightRequirement:
      sunlightRequirement === undefined
        ? undefined
        : String(sunlightRequirement).trim(),
    wateringSchedule:
      wateringSchedule === undefined ? undefined : String(wateringSchedule).trim(),
    soilType: soilType === undefined ? undefined : String(soilType).trim(),
    maintenanceLevel:
      maintenanceLevel === undefined ? undefined : String(maintenanceLevel).trim(),
    airPurifying: airPurifying === undefined ? undefined : Boolean(airPurifying),
    floweringType: floweringType === undefined ? undefined : floweringType,
    seasonalAvailability:
      seasonalAvailability === undefined
        ? undefined
        : String(seasonalAvailability).trim(),
    mainImage: mainImage === undefined ? undefined : String(mainImage).trim(),
    additionalImages,
    lifestyleImages,
    videoUrl: videoUrl === undefined ? undefined : String(videoUrl).trim(),
    image: gallery,
    seoTitle: seoTitle === undefined ? undefined : String(seoTitle).trim(),
    metaTitle: metaTitle === undefined ? undefined : String(metaTitle).trim(),
    metaDescription:
      metaDescription === undefined ? undefined : String(metaDescription).trim(),
    metaKeywords,
    reviewsEnabled:
      reviewsEnabled === undefined ? undefined : Boolean(reviewsEnabled),
    isActive: isActive === undefined ? undefined : Boolean(isActive),
  });

  Object.assign(product, update);
  await product.save();

  const fresh = await Product.findById(id).populate(
    "categoryId",
    "name slug kind plantSegment description coverImage"
  );
  res.json(fresh);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params || {};
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid product id");
    err.statusCode = 400;
    throw err;
  }
  const deleted = await Product.findByIdAndDelete(id);
  if (!deleted) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ success: true, message: "Product deleted" });
});

const addOrUpdateMyReview = asyncHandler(async (req, res) => {
  const { id } = req.params || {};
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid product id");
    err.statusCode = 400;
    throw err;
  }

  const { name, rating, comment } = req.body || {};
  const score = Number(rating);
  if (!name || !comment || !Number.isFinite(score) || score < 1 || score > 5) {
    const err = new Error("name, rating (1-5), and comment are required");
    err.statusCode = 400;
    throw err;
  }

  const product = await Product.findById(id);
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }
  if (product.reviewsEnabled === false) {
    const err = new Error("Reviews are disabled for this product");
    err.statusCode = 400;
    throw err;
  }

  const principalId = req.user?.id ? String(req.user.id) : null;
  const principalType = req.user?.type === "admin" ? "Admin" : "User";

  const existing = Array.isArray(product.reviews)
    ? product.reviews.find((r) => r.userId && String(r.userId) === principalId)
    : null;

  if (existing) {
    existing.name = String(name).trim();
    existing.rating = score;
    existing.comment = String(comment).trim();
    existing.createdAt = new Date();
  } else {
    product.reviews.push({
      userId: principalId,
      userModel: principalType,
      name: String(name).trim(),
      rating: score,
      comment: String(comment).trim(),
      createdAt: new Date(),
    });
  }

  await product.save();
  const fresh = await Product.findById(id).populate(
    "categoryId",
    "name slug kind plantSegment description coverImage"
  );
  res.status(existing ? 200 : 201).json(fresh);
});

const updateReview = asyncHandler(async (req, res) => {
  const { id, reviewId } = req.params || {};
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid product id");
    err.statusCode = 400;
    throw err;
  }
  if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
    const err = new Error("Invalid review id");
    err.statusCode = 400;
    throw err;
  }

  const { name, rating, comment } = req.body || {};
  const score = Number(rating);
  if (!name || !comment || !Number.isFinite(score) || score < 1 || score > 5) {
    const err = new Error("name, rating (1-5), and comment are required");
    err.statusCode = 400;
    throw err;
  }

  const product = await Product.findById(id);
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }
  const review = product.reviews?.id(reviewId);
  if (!review) {
    const err = new Error("Review not found");
    err.statusCode = 404;
    throw err;
  }

  const principalId = String(req.user?.id || "");
  const isAdmin = req.user?.type === "admin";
  if (!isAdmin && (!review.userId || String(review.userId) !== principalId)) {
    const err = new Error("You can only update your own review");
    err.statusCode = 403;
    throw err;
  }

  review.name = String(name).trim();
  review.rating = score;
  review.comment = String(comment).trim();
  review.createdAt = new Date();

  await product.save();
  const fresh = await Product.findById(id).populate(
    "categoryId",
    "name slug kind plantSegment description coverImage"
  );
  res.json(fresh);
});

module.exports = {
  productadd,
  listProducts,
  getProduct,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  addOrUpdateMyReview,
  updateReview,
};
