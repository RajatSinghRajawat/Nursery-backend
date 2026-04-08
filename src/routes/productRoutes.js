const express = require('express');
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/requireRole");
const {
  productadd,
  listProducts,
  getProduct,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  addOrUpdateMyReview,
  updateReview,
} = require("../controllers/productController");




// public read (slug before :id so "slug" is not parsed as id)
router.get("/", listProducts);
router.get("/slug/:slug", getProductBySlug);
router.get("/:id", getProduct);
router.post("/:id/reviews", authMiddleware, addOrUpdateMyReview);
router.put("/:id/reviews/:reviewId", authMiddleware, updateReview);

// admin write
router.post('/add' , authMiddleware,  requireRole(["admin", "superadmin"]), productadd);
router.put("/:id", authMiddleware, requireRole(["admin", "superadmin"]), updateProduct);
router.delete(
  "/:id",
  authMiddleware,
  requireRole(["admin", "superadmin"]),
  deleteProduct
);

module.exports = router;