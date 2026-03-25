const db = require("../DB_connection/db");
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
    const [existingUser] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already registered as a user"
      });
    }

    // Check if email belongs to a vendor (Optional sync check)
    const [existingVendor] = await db.query(
      "SELECT * FROM vendors WHERE email = ?",
      [email]
    );

    if (existingVendor.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already registered as a vendor. Please use a different email or log in as a vendor."
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.query(
      "INSERT INTO users (username,email,password,phonenumber) VALUES (?,?,?,?)",
      [finalUsername, email, hashedPassword, phonenumber]
    );

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
      userId: result.insertId
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


// ================= LOGIN =================

const login = async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success:false,
        message:"Email and password required"
      });
    }

    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User not found"
      });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      { user_id: user.id },
      process.env.SECRET_KEY,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      }
    });

  } catch (error) {

    console.error("Login Error:", error);

    return res.status(500).json({
      success:false,
      message:"Failed to login",
      error:error.message
    });

  }

};

module.exports = { register, login };