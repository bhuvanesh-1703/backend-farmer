const User = require("../models/User");
const Vendor = require("../models/Vendor");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../nodeMailer/mailSender");

// ================= REGISTER =================

const register = async (req, res) => {
  try {
    const { username, name, email, phonenumber, password } = req.body;
    const finalUsername = username || name;

    if (!email || !password || !finalUsername) {
      return res.status(400).json({
        success: false,
        message: "Email, password and username required"
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered as a user"
      });
    }

    // Check if email belongs to a vendor (Optional sync check)
    const existingVendor = await Vendor.findOne({ email });

    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: "Email already registered as a vendor. Please use a different email or log in as a vendor."
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const newUser = await User.create({
      username: finalUsername,
      email,
      password: hashedPassword,
      phonenumber
    });

    // Send welcome email (optional)
    try {
      const emailHtml = `
      <h1>Welcome to Farmer Market, ${finalUsername}!</h1>
      <p>Thank you for registering.</p>
      <p>You can now browse and buy fresh organic products directly from local farmers.</p>
      <br/>
      <p>Team Farmer Market</p>
      `;

      await sendEmail(email, "Welcome to Farmer Market", emailHtml);
    } catch (emailError) {
      console.log("Email sending failed:", emailError.message);
    }

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: newUser._id
    });

  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message
    });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      { user_id: user._id },
      process.env.SECRET_KEY,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to login",
      error: error.message
    });
  }
};

module.exports = { register, login };