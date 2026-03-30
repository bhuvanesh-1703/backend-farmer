const Vendor = require("../models/Vendor");
const User = require("../models/User");
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

    const existingVendor = await Vendor.findOne({ email });

    if (existingVendor) {
      return res.status(400).json({ success: false, message: "Email already registered as a vendor" });
    }

    // Check if email belongs to a user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered as a user. Please use a different email or log in as a user."
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newVendor = await Vendor.create({
      username,
      email,
      phonenumber,
      shop_name: shopName,
      password: hashPassword,
      id_proof: idProof
    });

    res.status(201).json({
      success: true,
      message: "Vendor registered successfully. Please wait for approval.",
      data: { id: newVendor._id }
    });
  } catch (err) {
    console.error("Vendor Registration Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const vendor = await Vendor.findOne({ email });

    if (!vendor) {
      return res.status(400).json({ success: false, message: "Vendor not found" });
    }

    const isMatch = await bcrypt.compare(password, vendor.password);
    
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign({ vendor_id: vendor._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { token, vendorData: vendor },
    });
  } catch (error) {
    console.error("Vendor Login Error:", error);
    return res.status(500).json({ success: false, message: "Failed to login" ,error});
  }
};

const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ created_at: -1 });
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

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const vendor = await Vendor.findByIdAndUpdate(id, { status }, { new: true });
    
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    const email = vendor.email;
    const emailhtml = `
      <h1>Vendor Status Updated</h1>
      <p>hello ${vendor.username},</p>
      <p>Your vendor status has been updated to ${status}</p>
      <br/>
      <p>Thank you for using our platform.</p>
      <p>The Farmer Market Team</p>
    `;

    await sendEmail(email, "Vendor Status Updated", emailhtml);
    res.status(200).json({ success: true, message: `Vendor status updated to ${status}` });
  } catch (err) {
    console.error("Update Vendor Status Error:", err);
    res.status(500).json({ success: false, message: "Failed to update vendor status" });
  }
};

const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findById(id).select("username email phonenumber shop_name status created_at");
    
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    res.status(200).json({ success: true, data: vendor });
  } catch (err) {
    console.error("Get Vendor By Id Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch vendor details" });
  }
};

const updateVendorProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, phonenumber, shopName } = req.body;

    const updatedVendor = await Vendor.findByIdAndUpdate(
      id,
      { username, phonenumber, shop_name: shopName },
      { new: true }
    ).select("username email phonenumber shop_name status");

    if (!updatedVendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Profile updated successfully",
      data: updatedVendor
    });
  } catch (err) {
    console.error("Update Vendor Profile Error:", err);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

module.exports = { register, login, getAllVendors, updateVendorStatus, getVendorById, updateVendorProfile };
