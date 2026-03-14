// const express = require("express");
// const authMiddleware = require("../middleware/authMiddleware");
// const { requireRole } = require("../middleware/requireRole");
// const {
//   listProducts,
//   getProduct,
//   createProduct,
//   updateProduct,
//   deleteProduct,
//   addReview,
// } = require("../controllers/productController");

// const router = express.Router();

// router.get("/", listProducts);
// router.get("/:id", getProduct);
// router.post("/:id/reviews", authMiddleware, addReview);

// router.post("/", authMiddleware, requireRole("admin"), createProduct);
// router.patch("/:id", authMiddleware, requireRole("admin"), updateProduct);
// router.delete("/:id", authMiddleware, requireRole("admin"), deleteProduct);

// module.exports = router;

