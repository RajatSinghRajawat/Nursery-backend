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
const { isSuperAdmin, protect } = require("../middleware/authMiddleware");


router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

router.get("/getAllAdmins", protect, isSuperAdmin, getAllAdmins);
router.get("/getAdminById:id", protect, getAdminById);

router.put("/updateAdmin/:id", protect, updateAdmin);
router.delete("/deleteAdmin:id", protect, isSuperAdmin, deleteAdmin);

router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

module.exports = router;