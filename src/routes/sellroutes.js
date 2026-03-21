const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/requireRole");

const { createSale, listSales, getSale } = require("../controllers/salesController");

// admin read/write
router.get("/", authMiddleware, requireRole(["admin", "superadmin"]), listSales);
router.get("/:id", authMiddleware, requireRole(["admin", "superadmin"]), getSale);
router.post("/", authMiddleware, requireRole(["admin", "superadmin"]), createSale);

module.exports = router;