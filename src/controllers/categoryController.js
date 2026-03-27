const mongoose = require("mongoose");
const Category = require("../models/Categories");
const asyncHandler = require("../utils/asyncHandler");

const pickDefined = (obj) => {
  const out = {};
  Object.keys(obj).forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
};

const listCategories = asyncHandler(async (req, res) => {
  const { active, kind, parent } = req.query || {};
  const filter = {};
  if (active === "true" || active === "1") filter.isActive = true;
  if (active === "false" || active === "0") filter.isActive = false;
  if (kind) filter.kind = String(kind);
  if (parent === "root" || parent === "null") {
    filter.$or = [{ parentCategory: null }, { parentCategory: { $exists: false } }];
  } else if (parent && mongoose.Types.ObjectId.isValid(String(parent))) {
    filter.parentCategory = String(parent);
  }

  const items = await Category.find(filter)
    .sort({ sortOrder: 1, name: 1 })
    .populate("parentCategory", "name slug")
    .lean();

  res.json({ items });
});

const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid category id");
    err.statusCode = 400;
    throw err;
  }
  const cat = await Category.findById(id).populate("parentCategory", "name slug");
  if (!cat) {
    const err = new Error("Category not found");
    err.statusCode = 404;
    throw err;
  }
  res.json(cat);
});

const getCategoryBySlug = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || "").toLowerCase();
  if (!slug) {
    const err = new Error("Slug required");
    err.statusCode = 400;
    throw err;
  }
  const cat = await Category.findOne({ slug }).populate(
    "parentCategory",
    "name slug kind plantSegment"
  );
  if (!cat) {
    const err = new Error("Category not found");
    err.statusCode = 404;
    throw err;
  }
  res.json(cat);
});

const createCategory = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const {
    name,
    description,
    slug,
    subcategories,
    Id,
    kind,
    plantSegment,
    parentCategory,
    coverImage,
    coverImages,
    iconKey,
    sortOrder,
    metaTitle,
    metaDescription,
    metaKeywords,
    isActive,
  } = body;

  if (!name || typeof name !== "string") {
    const err = new Error("name is required");
    err.statusCode = 400;
    throw err;
  }

  if (
    parentCategory &&
    !mongoose.Types.ObjectId.isValid(String(parentCategory))
  ) {
    const err = new Error("parentCategory is invalid");
    err.statusCode = 400;
    throw err;
  }

  const created = await Category.create({
    Id,
    name: name.trim(),
    description:
      description === undefined ? undefined : String(description).trim(),
    slug: slug === undefined ? undefined : String(slug).toLowerCase().trim(),
    subcategories: Array.isArray(subcategories) ? subcategories : [],
    kind: kind || "Plants",
    plantSegment: plantSegment === undefined ? "" : String(plantSegment),
    parentCategory: parentCategory || null,
    // Support both legacy single `coverImage` and new `coverImages[]`
    coverImages: (() => {
      if (Array.isArray(coverImages)) {
        return coverImages
          .map((s) => (typeof s === "string" ? s.trim() : ""))
          .filter(Boolean);
      }
      if (coverImage !== undefined && coverImage !== null && String(coverImage).trim()) {
        return [String(coverImage).trim()];
      }
      return [];
    })(),
    coverImage:
      typeof coverImage === "string" && coverImage.trim()
        ? coverImage.trim()
        : Array.isArray(coverImages) && coverImages.length
          ? String(coverImages[0]).trim()
          : "",
    iconKey: iconKey === undefined ? "" : String(iconKey).trim(),
    sortOrder: sortOrder === undefined ? 0 : Number(sortOrder),
    isActive: isActive === undefined ? true : Boolean(isActive),
    metaTitle: metaTitle === undefined ? "" : String(metaTitle).trim(),
    metaDescription:
      metaDescription === undefined ? "" : String(metaDescription).trim(),
    metaKeywords: Array.isArray(metaKeywords)
      ? metaKeywords.map((k) => String(k).trim()).filter(Boolean)
      : [],
  });

  const populated = await Category.findById(created._id).populate(
    "parentCategory",
    "name slug"
  );
  res.status(201).json(populated);
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid category id");
    err.statusCode = 400;
    throw err;
  }

  const body = req.body || {};
  const {
    name,
    description,
    slug,
    subcategories,
    Id,
    kind,
    plantSegment,
    parentCategory,
    coverImage,
    coverImages,
    iconKey,
    sortOrder,
    metaTitle,
    metaDescription,
    metaKeywords,
    isActive,
  } = body;

  if (
    parentCategory !== undefined &&
    parentCategory !== null &&
    parentCategory !== "" &&
    !mongoose.Types.ObjectId.isValid(String(parentCategory))
  ) {
    const err = new Error("parentCategory is invalid");
    err.statusCode = 400;
    throw err;
  }

  const cat = await Category.findById(id);
  if (!cat) {
    const err = new Error("Category not found");
    err.statusCode = 404;
    throw err;
  }

  // Normalize cover images so `coverImage` stays in sync with `coverImages[]`
  let resolvedCoverImages;
  if (coverImages !== undefined) {
    resolvedCoverImages = Array.isArray(coverImages)
      ? coverImages.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean)
      : [];
  }

  const resolvedCoverImage =
    resolvedCoverImages !== undefined
      ? resolvedCoverImages[0] || ""
      : coverImage !== undefined && coverImage !== null
        ? String(coverImage).trim()
        : undefined;

  const update = pickDefined({
    name: name === undefined ? undefined : String(name).trim(),
    description:
      description === undefined ? undefined : String(description).trim(),
    slug: slug === undefined ? undefined : String(slug).toLowerCase().trim(),
    subcategories,
    Id,
    kind,
    plantSegment:
      plantSegment === undefined ? undefined : String(plantSegment),
    parentCategory:
      parentCategory === undefined
        ? undefined
        : parentCategory === null || parentCategory === ""
          ? null
          : String(parentCategory),
    coverImages: resolvedCoverImages,
    coverImage: resolvedCoverImage,
    iconKey: iconKey === undefined ? undefined : String(iconKey).trim(),
    sortOrder: sortOrder === undefined ? undefined : Number(sortOrder),
    isActive: isActive === undefined ? undefined : Boolean(isActive),
    metaTitle: metaTitle === undefined ? undefined : String(metaTitle).trim(),
    metaDescription:
      metaDescription === undefined ? undefined : String(metaDescription).trim(),
    metaKeywords,
  });

  Object.assign(cat, update);
  await cat.save();

  const updated = await Category.findById(id).populate(
    "parentCategory",
    "name slug"
  );
  res.json(updated);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid category id");
    err.statusCode = 400;
    throw err;
  }
  const deleted = await Category.findByIdAndDelete(id);
  if (!deleted) {
    const err = new Error("Category not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ success: true, message: "Category deleted" });
});

module.exports = {
  listCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
