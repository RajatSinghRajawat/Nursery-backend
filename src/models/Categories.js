const mongoose = require("mongoose");

const CATEGORY_KINDS = [
  "Plants",
  "Tools",
  "Pots",
  "Seeds",
  "Care",
  "Decoration",
  "Other",
];

const PLANT_SEGMENTS = [
  "Indoor",
  "Outdoor",
  "Flowering",
  "Bonsai",
  "Decoration",
  "FruitTrees",
  "Herbal",
  "Succulent",
  "Other",
  "",
];

const subcategorySchema = new mongoose.Schema(
  {
    Id: { type: String },
    name: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    Id: { type: String },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    /** Top-level group shown to customers, e.g. Plants */
    kind: {
      type: String,
      enum: CATEGORY_KINDS,
      default: "Plants",
    },
    /** When kind is Plants: Indoor, Outdoor, Flowering, etc. */
    plantSegment: {
      type: String,
      enum: PLANT_SEGMENTS,
      default: "",
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    isActive: { type: Boolean, default: true },
    subcategories: [subcategorySchema],

  },
  { timestamps: true }
);

categorySchema.index({ parentCategory: 1, sortOrder: 1 });
categorySchema.index({ kind: 1, plantSegment: 1 });

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
module.exports.CATEGORY_KINDS = CATEGORY_KINDS;
module.exports.PLANT_SEGMENTS = PLANT_SEGMENTS;
