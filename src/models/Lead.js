const mongoose = require("mongoose");

const LEAD_STATUSES = ["New", "Contacted", "Closed", "Lost"];

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    subject: { type: String, trim: true, default: "" },
    message: { type: String, trim: true, default: "" },
    inquiryType: { type: String, trim: true, default: "General" },
    status: { type: String, enum: LEAD_STATUSES, default: "New" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);
module.exports.LEAD_STATUSES = LEAD_STATUSES;
