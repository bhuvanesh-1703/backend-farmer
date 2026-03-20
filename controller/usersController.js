const bcrypt = require("bcrypt");
const db = require("../DB_connection/db");

const getUsers = async (req, res) => {
  try {
    const [users] = await db.query("SELECT * FROM users");

    res.status(200).json({ success: true, message: "User get successfully", users });
  } catch (error) {
    res.status(400).json({ success: false, message: "User failed to get" });
  }
};

const postUsers = async (req, res) => {
  try {
    const { username, email, password, phonenumber } = req.body;

    // console.log(req.body);

    const [existingUser] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
    );

    if (existingUser.length > 0) {
      return res.status(400).json({success: false,
  message: "Email already registered",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const [users] = await db.query(
      "INSERT INTO users (username,email,password,phonenumber) VALUES (?,?,?,?)",
      [username, email, hashPassword, phonenumber],
    );

    res
      .status(200)
      .json({ success: true, message: "user register success", users });
    // console.log("users==", users);
  } catch (error) {
    res.status(400).json({ success: false, message: "user register failed", error: error.message });
  }
};

const updateUsers = async (req, res) => {
  try {
    const userId = req.params.id;

    const [userUpdate] = await db.query("UPDATE users SET ? WHERE id = ?", [
      req.body,
      userId,
    ]);

    if (userUpdate.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const [updatedUser] = await db.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);

    res.status(200).json({ success: true, message: "User updated", data: updatedUser });
  } catch (err) {
    res.status(400).json({ success: false, message: "Update failed", error: err.message });
  }
};
const deleteUsers = async (req, res) => {
  try {
    const userId = req.params.id;

    const [userDel] = await db.query("DELETE FROM users WHERE id = ?", [userId]);

    // console.log("delete");

   
    if (userDel.affectedRows === 0) {
      return res.status(404).json({success: false, message: "User not found",
      });
    }

    res.status(200).json({success: true, message: "User deleted"});
  } catch (err) {
    res.status(400).json({
      success: false, message: "Failed to delete user", error: err.message,
    });
  }
};

module.exports = { getUsers, postUsers, updateUsers, deleteUsers };
