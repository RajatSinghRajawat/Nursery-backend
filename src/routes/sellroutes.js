const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/requireRole");

const { createSale, listSales, getSale, salesSummary } = require("../controllers/salesController");

// admin read/write
router.get("/", authMiddleware, requireRole(["admin", "superadmin"]), listSales);
router.get("/summary", authMiddleware, requireRole(["admin", "superadmin"]), salesSummary);
router.get("/:id", authMiddleware, requireRole(["admin", "superadmin"]), getSale);
router.post("/", authMiddleware, requireRole(["admin", "superadmin"]), createSale);

module.exports = router;