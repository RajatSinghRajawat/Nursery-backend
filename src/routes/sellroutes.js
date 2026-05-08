const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/requireRole");

const { createSale, listSales, getSale, salesSummary, salesProductSummary } = require("../controllers/salesController");

// Superadmin only (POS / sales reporting)
router.get("/", authMiddleware, requireRole(["superadmin"]), listSales);
router.get("/summary", authMiddleware, requireRole(["superadmin"]), salesSummary);
router.get("/product-summary", authMiddleware, requireRole(["superadmin"]), salesProductSummary);
router.get("/:id", authMiddleware, requireRole(["superadmin"]), getSale);
router.post("/", authMiddleware, requireRole(["superadmin"]), createSale);

module.exports = router;