const express = require("express");
const router = express.Router();

const {
  registerAdmin,
  loginAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  forgotPassword,
  resetPassword,
} = require("../controllers/admin");
const { listAllOrders, updateOrderStatus } = require("../controllers/orderController");
const { dashboardStats } = require("../controllers/statsController");
const {
  listUsersForAdmin,
  getUserOrdersForAdmin,
  listLeadsForAdmin,
  updateLeadStatus,
  deleteLead,
} = require("../controllers/customerLeadController");
const { isSuperAdmin, protect } = require("../middleware/authMiddleware");


router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

router.get("/getAllAdmins", protect, isSuperAdmin, getAllAdmins);
router.get("/getAdminById/:id", protect, getAdminById);

router.put("/updateAdmin/:id", protect, updateAdmin);
router.delete("/deleteAdmin/:id", protect, isSuperAdmin, deleteAdmin);

// SuperAdmin-only admin creation (UI uses this)
router.post("/create", protect, isSuperAdmin, registerAdmin);

router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

router.get("/stats", protect, dashboardStats);
router.get("/orders", protect, listAllOrders);
router.patch("/orders/:id/status", protect, updateOrderStatus);
router.get("/users", protect, listUsersForAdmin);
router.get("/users/:id/orders", protect, getUserOrdersForAdmin);
router.get("/leads", protect, listLeadsForAdmin);
router.put("/leads/:id", protect, updateLeadStatus);
router.delete("/leads/:id", protect, isSuperAdmin, deleteLead);

module.exports = router;