const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, required: true, trim: true },
    image: { type: String, trim: true, default: "" },
    isApproved: { type: Boolean, default: false },
    source: { type: String, enum: ["user", "admin"], default: "user" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Testimonial", testimonialSchema);
