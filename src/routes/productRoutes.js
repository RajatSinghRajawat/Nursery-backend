const express = require('express');
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/requireRole");
const { productadd, listProducts, getProduct, updateProduct } = require('../controllers/productController');




// public read
router.get("/", listProducts);
router.get("/:id", getProduct);

// admin write
router.post('/add' , authMiddleware, requireRole(["admin", "superadmin"]), productadd);
router.put("/:id", authMiddleware, requireRole(["admin", "superadmin"]), updateProduct);

module.exports = router;