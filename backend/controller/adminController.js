const db = require("../DB_connection/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../nodeMailer/mailSender");

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    // console.log(req.body);
    
    const [users] = await db.query("SELECT * FROM users WHERE email = ? AND role = 'admin'", [email]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    const admin = users[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin.id, role: 'admin' }, 
      process.env.SECRET_KEY, 
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: { 
        token, 
        admin: { id: admin.id, username: admin.username, email: admin.email, role: admin.role } 
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
    const [userRes] = await db.query("SELECT COUNT(*) as count FROM users");
    const [productRes] = await db.query("SELECT COUNT(*) as count FROM products");
    const [categoryRes] = await db.query("SELECT COUNT(*) as count FROM categories");
    const [orderRes] = await db.query(
      "SELECT COUNT(*) as count FROM orders WHERE order_status = 'Placed' OR order_status = 'Pending'"
    );

    res.status(200).json({
      success: true,
      data: {
        users: userRes[0].count,
        products: productRes[0].count,
        categories: categoryRes[0].count,
        pendingOrders: orderRes[0].count
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

    await db.query("UPDATE vendors SET status = ? WHERE id = ?", [status, id]);

    // Fetch vendor details for email
    const [vendors] = await db.query("SELECT username, email FROM vendors WHERE id = ?", [id]);
    if (vendors.length > 0) {
      const vendor = vendors[0];
      const emailHtml = `
        <h1>Vendor Account Update</h1>
        <p>Hello ${vendor.username},</p>
        <p>Your vendor account status has been updated to: <strong>${status.toUpperCase()}</strong>.</p>
        ${status === 'approved' ? '<p>You can now log in and start adding your products!</p>' : ''}
        <br/>
        <p>Best Regards,<br/>Farmer Market Team</p>
      `;
      await sendEmail(vendor.email, "Vendor Status Update", emailHtml);
    }

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

    const [result] = await db.query("UPDATE products SET status = ? WHERE id = ?", [status, id]);

    if (result.affectedRows === 0) {
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
