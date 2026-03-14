const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const normalizeRole = (role) => {
  if (role === undefined || role === null) return "user";
  if (typeof role === "number") return role === 1 ? "admin" : "user";
  const r = String(role).trim().toLowerCase();
  if (r === "1") return "admin";
  if (r === "0" || r === "") return "user";
  return r;
};

const requireRole = (role) =>
  asyncHandler(async (req, _res, next) => {
    const userId = req.user && req.user.id;
    if (!userId) {
      const err = new Error("Not authenticated");
      err.statusCode = 401;
      throw err;
    }

    const user = await User.findById(userId).select("role");
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    const current = normalizeRole(user.role);
    if (current !== role) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      throw err;
    }

    next();
  });

module.exports = { requireRole, normalizeRole };

