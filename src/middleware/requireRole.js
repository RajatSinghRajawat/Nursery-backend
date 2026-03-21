const User = require("../models/User");
const Admin = require("../models/admin");
const asyncHandler = require("../utils/asyncHandler");

const normalizeRole = (role) => {
  if (role === undefined || role === null) return "user";
  if (typeof role === "number") return role === 1 ? "admin" : "user";
  const r = String(role).trim().toLowerCase();
  if (r === "1") return "admin";
  if (r === "0" || r === "") return "user";
  return r;
};

const requireRole = (roleOrRoles) =>
  asyncHandler(async (req, _res, next) => {
    const userId = req.user && req.user.id;
    const principalType = (req.user && req.user.type) || "user";
    if (!userId) {
      const err = new Error("Not authenticated");
      err.statusCode = 401;
      throw err;
    }

    const Model = principalType === "admin" ? Admin : User;
    const user = await Model.findById(userId).select("role isSuperAdmin");
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    const current = normalizeRole(user.role);
    const allowed = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];

    // super admins are still "admin" but have additional privileges
    const currentEffective =
      user.isSuperAdmin && current === "admin" ? "superadmin" : current;

    const normalizedAllowed = allowed.map((r) => String(r).trim().toLowerCase());

    if (!normalizedAllowed.includes(current) && !normalizedAllowed.includes(currentEffective)) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      throw err;
    }

    next();
  });

const requireSuperAdmin = asyncHandler(async (req, _res, next) => {
  const userId = req.user && req.user.id;
  const principalType = (req.user && req.user.type) || "user";
  if (!userId) {
    const err = new Error("Not authenticated");
    err.statusCode = 401;
    throw err;
  }

  const Model = principalType === "admin" ? Admin : User;
  const user = await Model.findById(userId).select("role isSuperAdmin");
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const current = normalizeRole(user.role);
  if (current !== "admin" || !user.isSuperAdmin) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }

  next();
});

module.exports = { requireRole, requireSuperAdmin, normalizeRole };

