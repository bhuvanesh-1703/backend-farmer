const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const Vendor = require("../models/Vendor");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../nodeMailer/mailSender");

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const admin = await User.findOne({ email, role: 'admin' });

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, role: 'admin' }, 
      process.env.SECRET_KEY, 
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: { 
        token, 
        admin: { id: admin._id, username: admin.username, email: admin.email, role: admin.role } 
      }
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const categoryCount = await Category.countDocuments();
    const pendingOrderCount = await Order.countDocuments({
      order_status: { $in: ["Placed", "Pending"] }
    });

    res.status(200).json({
      success: true,
      data: {
        users: userCount,
        products: productCount,
        categories: categoryCount,
        pendingOrders: pendingOrderCount
      }
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" });
  }
};

// Update Vendor Status (Approve/Reject)
const updateVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const vendor = await Vendor.findByIdAndUpdate(id, { status }, { new: true });
    
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    const emailHtml = `
      <h1>Vendor Account Update</h1>
      <p>Hello ${vendor.username},</p>
      <p>Your vendor account status has been updated to: <strong>${status.toUpperCase()}</strong>.</p>
      ${status === 'approved' ? '<p>You can now log in and start adding your products!</p>' : ''}
      <br/>
      <p>Best Regards,<br/>Farmer Market Team</p>
    `;
    await sendEmail(vendor.email, "Vendor Status Update", emailHtml);

    res.status(200).json({ success: true, message: `Vendor status updated to ${status}` });
  } catch (error) {
    console.error("Update Vendor Status Error:", error);
    res.status(500).json({ success: false, message: "Failed to update vendor status" });
  }
};

// Update Product Status (Approve/Reject)
const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, { status }, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, message: `Product status updated to ${status}` });
  } catch (error) {
    console.error("Update Product Status Error:", error);
    res.status(500).json({ success: false, message: "Failed to update product status" });
  }
};

module.exports = { 
  adminLogin, 
  getDashboardStats, 
  updateVendorStatus, 
  updateProductStatus 
};
