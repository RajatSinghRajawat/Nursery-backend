const asyncHandler = require("../utils/asyncHandler");
const Testimonial = require("../models/Testimonial");

const listPublicTestimonials = asyncHandler(async (_req, res) => {
  const items = await Testimonial.find({ isApproved: true })
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ items });
});

const createTestimonial = asyncHandler(async (req, res) => {
  const { name, email = "", city = "", rating, review, image = "" } = req.body || {};
  const score = Number(rating);
  if (!name || !review || !Number.isFinite(score) || score < 1 || score > 5) {
    const err = new Error("name, rating (1-5), and review are required");
    err.statusCode = 400;
    throw err;
  }

  const item = await Testimonial.create({
    name: String(name).trim(),
    email: String(email || "").trim(),
    city: String(city || "").trim(),
    rating: score,
    review: String(review).trim(),
    image: String(image || "").trim(),
    source: req.user?.type === "admin" ? "admin" : "user",
    userId: req.user?.type === "user" ? req.user.id : undefined,
    isApproved: req.user?.type === "admin",
  });

  res.status(201).json(item);
});

const listAdminTestimonials = asyncHandler(async (_req, res) => {
  const items = await Testimonial.find({}).sort({ createdAt: -1 }).limit(300);
  res.json({ items });
});

const setApproval = asyncHandler(async (req, res) => {
  const { id } = req.params || {};
  const { isApproved } = req.body || {};
  const item = await Testimonial.findByIdAndUpdate(
    id,
    { isApproved: Boolean(isApproved) },
    { new: true }
  );
  if (!item) {
    const err = new Error("Testimonial not found");
    err.statusCode = 404;
    throw err;
  }
  res.json(item);
});

const deleteTestimonial = asyncHandler(async (req, res) => {
  const { id } = req.params || {};
  const item = await Testimonial.findByIdAndDelete(id);
  if (!item) {
    const err = new Error("Testimonial not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ ok: true });
});

module.exports = {
  listPublicTestimonials,
  createTestimonial,
  listAdminTestimonials,
  setApproval,
  deleteTestimonial,
};
