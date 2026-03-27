const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/requireRole");
const {
  listPublicTestimonials,
  createTestimonial,
  listAdminTestimonials,
  setApproval,
  deleteTestimonial,
} = require("../controllers/testimonialController");

router.get("/", listPublicTestimonials);
router.post("/", authMiddleware, createTestimonial);
router.get("/admin", authMiddleware, requireRole(["admin", "superadmin"]), listAdminTestimonials);
router.patch("/admin/:id/approval", authMiddleware, requireRole(["admin", "superadmin"]), setApproval);
router.delete("/admin/:id", authMiddleware, requireRole(["admin", "superadmin"]), deleteTestimonial);

module.exports = router;
