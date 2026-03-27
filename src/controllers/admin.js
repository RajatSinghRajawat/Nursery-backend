const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");

const generateToken = (id, role) => {
  return jwt.sign(
    { id: String(id), role, type: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    const emailNorm = email ? String(email).toLowerCase().trim() : "";

    if (!name || !emailNorm || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const exists = await Admin.findOne({ email: emailNorm });
    if (exists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    // Only superadmin (when using protected route) can set admin role.
    // Public /register bootstrap defaults to "admin".
    const canSetRole = req.admin && req.admin.role === "superadmin";
    const normalizedRole = role ? String(role).trim().toLowerCase() : "admin";
    const roleToSet =
      canSetRole && ["admin", "superadmin"].includes(normalizedRole)
        ? normalizedRole
        : "admin";

    const admin = await Admin.create({
      name,
      email: emailNorm,
      password: hash,
      role: roleToSet,
    });

    res.status(201).json({
      success: true,
      message: "Admin Registered",
      token: generateToken(admin._id, admin.role),
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* LOGIN */
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const emailNorm = email ? String(email).toLowerCase().trim() : "";

    if (!emailNorm || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email: emailNorm });

    if (admin && (await bcrypt.compare(password, admin.password))) {

      admin.lastLoginAt = new Date();
      await admin.save();

      res.json({
        success: true,
        message: "Login Success",
        token: generateToken(admin._id, admin.role),
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      });

    } else {
      res.status(401).json({
        message: "Invalid email or password. Register an admin first via POST /api/admin/register if none exists.",
      });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* GET ALL ADMINS */
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password");

    res.json({
      success: true,
      count: admins.length,
      data: admins,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* GET SINGLE ADMIN */
exports.getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({ success: true, data: admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* UPDATE */
exports.updateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (
      String(req.admin._id) !== String(admin._id) &&
      req.admin.role !== "superadmin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    admin.name = req.body.name || admin.name;
    admin.email = req.body.email || admin.email;

    if (req.body.password) {
      admin.password = await bcrypt.hash(req.body.password, 10);
    }

    await admin.save();

    res.json({
      success: true,
      message: "Updated successfully",
      data: admin,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* DELETE */
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // 🔥 Only superadmin can delete
    if (req.admin.role !== "superadmin") {
      return res.status(403).json({ message: "Only SuperAdmin can delete" });
    }

    await admin.deleteOne();

    res.json({
      success: true,
      message: "Deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const admin = await Admin.findOne({ email: req.body.email });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // 🔥 Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 🔐 Hash token (DB me safe)
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    admin.resetPasswordToken = hashedToken;
    admin.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 min

    await admin.save();

    // 🔗 Reset link
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    res.json({
      success: true,
      message: "Reset link generated",
      resetUrl,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // 🔐 Hash token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    // 🔥 Update password
    admin.password = await bcrypt.hash(password, 10);

    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;

    await admin.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};