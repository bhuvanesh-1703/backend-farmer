const db = require("../DB_connection/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../nodeMailer/mailSender");

const register = async (req, res) => {
  try {
    const { username, email, phonenumber, shopName, password } = req.body;
    const idProof = req.file ? req.file.filename : null;

    if (!idProof) {
      return res.status(400).json({ success: false, message: "ID Proof is required" });
    }

    const [existingVendor] = await db.query("SELECT * FROM vendors WHERE email=?", [email]);

    if (existingVendor.length > 0) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "INSERT INTO vendors (username, email, phonenumber, shop_name, password, id_proof) VALUES (?,?,?,?,?,?)",
      [username, email, phonenumber, shopName, hashPassword, idProof]
    );

    res.status(201).json({
      success: true,
      message: "Vendor registered successfully. Please wait for approval.",
      data: { id: result.insertId }
    });
  } catch (err) {
    console.error("Vendor Registration Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // console.log("Login attempt for email:", email);
    const [vendors] = await db.query("SELECT * FROM vendors WHERE email = ?", [email]);

    // console.log("Vendors found:", vendors.length);
    
    if (vendors.length === 0) {
      // console.log("Vendor not found");
      return res.status(400).json({ success: false, message: "Vendor not found" });
    }

    const vendor = vendors[0];
    // console.log("Stored hash:", vendor.password);
    const isMatch = await bcrypt.compare(password, vendor.password);
    // console.log("Password match:", isMatch);
    
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    // console.log("SECRET_KEY during login:", process.env.SECRET_KEY);

    const token = jwt.sign({ vendor_id: vendor.id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { token, vendorData: vendors[0] },
    });
  } catch (error) {
    console.error("Vendor Login Error:", error);
    return res.status(500).json({ success: false, message: "Failed to login" ,error});
  }
};

const getAllVendors = async (req, res) => {
  try {
    const [vendors] = await db.query("SELECT * FROM vendors ORDER BY created_at DESC");
    res.status(200).json({ success: true, data: vendors });
  } catch (err) {
    console.error("Get All Vendors Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch vendors" });
  }
};

const updateVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    // console.log(status);
    

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    await db.query("UPDATE vendors SET status = ? WHERE id = ?", [status, id]);

    const [vendor] = await db.query("SELECT * FROM vendors WHERE id = ?", [id]);
    const email = vendor[0].email;
    const emailhtml = `
      <h1>Vendor Status Updated</h1>
      <p>hello ${vendor[0].username},</p>
      <p>Your vendor status has been updated to ${status}</p>
      <br/>
      <p>Thank you for using our platform.</p>
      <p>The Farmer Market Team</p>
    `;

    await sendEmail(email, "Vendor Status Updated",emailhtml);
    res.status(200).json({ success: true, message: `Vendor status updated to ${status}` });
  } catch (err) {
    console.error("Update Vendor Status Error:", err);
    res.status(500).json({ success: false, message: "Failed to update vendor status" });
  }
};

const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    const [vendors] = await db.query("SELECT id, username, email, phonenumber, shop_name, status, created_at FROM vendors WHERE id = ?", [id]);
    
    if (vendors.length === 0) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    res.status(200).json({ success: true, data: vendors[0] });
  } catch (err) {
    console.error("Get Vendor By Id Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch vendor details" });
  }
};

const updateVendorProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, phonenumber, shopName } = req.body;

    await db.query(
      "UPDATE vendors SET username = ?, phonenumber = ?, shop_name = ? WHERE id = ?",
      [username, phonenumber, shopName, id]
    );

    const [updatedVendor] = await db.query("SELECT id, username, email, phonenumber, shop_name, status FROM vendors WHERE id = ?", [id]);

    res.status(200).json({ 
      success: true, 
      message: "Profile updated successfully",
      data: updatedVendor[0]
    });
  } catch (err) {
    console.error("Update Vendor Profile Error:", err);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

module.exports = { register, login, getAllVendors, updateVendorStatus, getVendorById, updateVendorProfile };
