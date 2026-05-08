const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/ordermodels");
const Lead = require("../models/Lead");
const asyncHandler = require("../utils/asyncHandler");

const listUsersForAdmin = asyncHandler(async (_req, res) => {
  const users = await User.find({})
    .select("firstName name email phone profilePicture gender dateOfBirth address createdAt")
    .sort({ createdAt: -1 });
  res.json(users);
});

const getUserOrdersForAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params || {};
  if (!id || !mongoose.Types.ObjectId.isValid(String(id))) {
    const err = new Error("Invalid user id");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(id).select("firstName name email phone");
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const orders = await Order.find({ user: id }).sort({ createdAt: -1 });
  const totals = orders.reduce(
    (acc, order) => {
      acc.orderCount += 1;
      acc.totalAmount += Number(order.totalPrice || 0);
      acc.totalItems += Array.isArray(order.orderItems)
        ? order.orderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
        : 0;
      return acc;
    },
    { orderCount: 0, totalAmount: 0, totalItems: 0 }
  );

  res.json({ user, totals, items: orders });
});

const listLeadsForAdmin = asyncHandler(async (_req, res) => {
  const leads = await Lead.find({}).sort({ createdAt: -1 });
  res.json(leads);
});

const createLead = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  if (!payload.name) {
    const err = new Error("name is required");
    err.statusCode = 400;
    throw err;
  }
  const lead = await Lead.create({
    name: payload.name,
    email: payload.email || "",
    phone: payload.phone || "",
    subject: payload.subject || "",
    message: payload.message || "",
    inquiryType: payload.inquiryType || "General",
  });
  res.status(201).json(lead);
});

const updateLeadStatus = asyncHandler(async (req, res) => {
  const { id } = req.params || {};
  const { status } = req.body || {};
  if (!id || !mongoose.Types.ObjectId.isValid(String(id))) {
    const err = new Error("Invalid lead id");
    err.statusCode = 400;
    throw err;
  }
  const allowed = ["New", "Contacted", "Closed", "Lost"];
  if (!status || !allowed.includes(String(status))) {
    const err = new Error(`status must be one of: ${allowed.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }
  const lead = await Lead.findById(id);
  if (!lead) {
    const err = new Error("Lead not found");
    err.statusCode = 404;
    throw err;
  }
  lead.status = String(status);
  await lead.save();
  res.json(lead);
});

const deleteLead = asyncHandler(async (req, res) => {
  const { id } = req.params || {};
  if (!id || !mongoose.Types.ObjectId.isValid(String(id))) {
    const err = new Error("Invalid lead id");
    err.statusCode = 400;
    throw err;
  }
  const lead = await Lead.findById(id);
  if (!lead) {
    const err = new Error("Lead not found");
    err.statusCode = 404;
    throw err;
  }
  await lead.deleteOne();
  res.json({ ok: true });
});

module.exports = {
  listUsersForAdmin,
  getUserOrdersForAdmin,
  listLeadsForAdmin,
  createLead,
  updateLeadStatus,
  deleteLead,
};
