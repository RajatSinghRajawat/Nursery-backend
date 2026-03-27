const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/requireRole");
const {
  listCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

router.get("/", listCategories);
router.get("/slug/:slug", getCategoryBySlug);
router.get("/:id", getCategoryById);

router.post("/", authMiddleware, requireRole(["admin", "superadmin"]), createCategory);
router.put("/:id", authMiddleware, requireRole(["admin", "superadmin"]), updateCategory);
router.delete("/:id", authMiddleware, requireRole(["admin", "superadmin"]), deleteCategory);

module.exports = router;
