const mongoose = require("mongoose");

const STOCK_STATUS = ["in_stock", "out_of_stock", "on_request"];
const DISCOUNT_TYPES = ["percent", "amount"];
const FLOWERING_TYPES = ["Flowering", "Non-Flowering", "NA"];
const HEIGHT_UNITS = ["cm", "inches"];

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, refPath: "reviews.userModel" },
    userModel: { type: String, enum: ["User", "Admin"], default: "User" },
    name: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    comment: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    /** Display / SEO product title */
    name: { type: String, required: true, trim: true },
    /** Unique stock-keeping id — enforced on create in API; sparse for legacy rows */
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    /**
     * Optional mapping for customer-facing filtering inside a category page.
     * Stored as subcategory names (e.g. "Low Light Plants") chosen by admin.
     */
    subcategoriesText: { type: [String], default: [] },

    shortDescription: { type: String, trim: true, default: "" },
    detailedDescription: { type: String, trim: true, default: "" },
    /** Legacy single description — kept in sync for older clients */
    description: { type: String, trim: true, default: "" },

    highlights: [{ type: String, trim: true }],

    plantType: { type: String, trim: true, default: "" },
    botanicalName: { type: String, trim: true, default: "" },
    commonName: { type: String, trim: true, default: "" },

    heightValue: { type: Number, min: 0 },
    heightUnit: { type: String, enum: HEIGHT_UNITS, default: "cm" },
    heightLabel: { type: String, trim: true, default: "" },
    plantAge: { type: String, trim: true, default: "" },

    mrp: { type: Number, min: 0, default: 0 },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0 },
    discountType: { type: String, enum: DISCOUNT_TYPES, default: "amount" },
    gstPercent: { type: Number, min: 0, max: 100, default: 0 },

    stock: { type: Number, required: true, min: 0, default: 0 },
    stockStatus: { type: String, enum: STOCK_STATUS, default: "in_stock" },
    minOrderQty: { type: Number, min: 1, default: 1 },

    growthType: { type: String, trim: true, default: "" },
    sunlightRequirement: { type: String, trim: true, default: "" },
    wateringSchedule: { type: String, trim: true, default: "" },
    soilType: { type: String, trim: true, default: "" },
    maintenanceLevel: { type: String, trim: true, default: "" },
    airPurifying: { type: Boolean, default: false },
    floweringType: { type: String, enum: FLOWERING_TYPES, default: "NA" },
    seasonalAvailability: { type: String, trim: true, default: "" },


    videoUrl: { type: String, trim: true, default: "" },
    image: { type: [String], default: [] },

    seoTitle: { type: String, trim: true, default: "" },
    metaTitle: { type: String, trim: true, default: "" },
    metaDescription: { type: String, trim: true, default: "" },
    metaKeywords: [{ type: String, trim: true }],

    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    reviewsEnabled: { type: Boolean, default: true },
    reviews: [reviewSchema],

    soldBy: { type: String, required: true, trim: true, default: "Nursery" },
    responseRate: { type: Number, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

function mergeImages(doc) {
  const out = [];
  const push = (u) => {
    const s = typeof u === "string" ? u.trim() : "";
    if (s && !out.includes(s)) out.push(s);
  };
  if (doc.mainImage) push(doc.mainImage);
  (doc.additionalImages || []).forEach(push);
  (doc.lifestyleImages || []).forEach(push);
  (doc.image || []).forEach(push);
  doc.image = out;
  if (!doc.mainImage && out[0]) doc.mainImage = out[0];
}

function recomputeRatings(doc) {
  const list = doc.reviews || [];
  if (!list.length) {
    doc.averageRating = 0;
    doc.reviewCount = 0;
    return;
  }
  const sum = list.reduce((s, r) => s + (Number(r.rating) || 0), 0);
  doc.reviewCount = list.length;
  doc.averageRating = Math.round((sum / list.length) * 10) / 10;
}

productSchema.pre("save", function () {
  if (!this.detailedDescription && this.description) {
    this.detailedDescription = this.description;
  }
  if (!this.description && this.detailedDescription) {
    this.description = this.detailedDescription;
  }
  if (!this.shortDescription && this.detailedDescription) {
    this.shortDescription = String(this.detailedDescription).slice(0, 220);
  }
  mergeImages(this);
  if (this.stock <= 0 && this.stockStatus === "in_stock") {
    this.stockStatus = "out_of_stock";
  }
  if (this.stock > 0 && this.stockStatus === "out_of_stock") {
    this.stockStatus = "in_stock";
  }
  recomputeRatings(this);
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
module.exports.STOCK_STATUS = STOCK_STATUS;
