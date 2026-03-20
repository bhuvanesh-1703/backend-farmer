const db = require("../DB_connection/db");

const createCart = async (req, res) => {
  try {
    const { productId, userId, quantity } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ success: false, message: "User ID and Product ID are required." });
    }

    const [userExists] = await db.query("SELECT id FROM users WHERE id = ?", [userId]);
    if (userExists.length === 0) {
      return res.status(401).json({ success: false, message: "User not found. Please log in again." });
    }

    const [productExists] = await db.query("SELECT id FROM products WHERE id = ?", [productId]);
    if (productExists.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const [existing] = await db.query(
      "SELECT * FROM cart WHERE product_id = ? AND user_id = ?",
      [productId, userId]
    );

    if (existing.length > 0) {
      await db.query(
        "UPDATE cart SET quantity = quantity + ? WHERE product_id = ? AND user_id = ?",
        [quantity || 1, productId, userId]
      );

      const [updatedCart] = await db.query(
        "SELECT * FROM cart WHERE product_id = ? AND user_id = ?",
        [productId, userId]
      );

      return res.status(200).json({
        success: true,
        message: "Cart quantity updated",
        data: updatedCart[0],
      });
    }

    const [result] = await db.query(
      "INSERT INTO cart (product_id, user_id, quantity) VALUES (?, ?, ?)",
      [productId, userId, quantity || 1]
    );

    const [newCart] = await db.query(
      "SELECT * FROM cart WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Product added to cart",
      data: newCart[0],
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create cart",
      error: error.message,
    });
  }
};

const getCart = async (req, res) => {
  try {
    const { userId } = req.query;

    const [cart] = await db.query(
      `SELECT 
        cart.id,
        cart.quantity,
        cart.product_id,
        products.name,
        products.price,
        products.image,
        categories.category_name
       FROM cart
       JOIN products ON cart.product_id = products.id
       JOIN categories ON products.categories_id = categories.id
       WHERE cart.user_id = ?`,
      [userId]
    );

    res.status(200).json({
      success: true,
      count: cart.length,
      data: cart,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
};

const updateCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    await db.query(
      "UPDATE cart SET quantity = ? WHERE id = ?",
      [quantity, id]
    );

    const [updatedCart] = await db.query(
      "SELECT * FROM cart WHERE id = ?",
      [id]
    );

    if (updatedCart.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Quantity updated",
      data: updatedCart[0],
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Update failed",
      error: error.message,
    });
  }
};


const deleteCart = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query(
      "SELECT * FROM cart WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    await db.query("DELETE FROM cart WHERE id = ?", [id]);

    res.status(200).json({
      success: true,
      message: "Product removed",
      data: existing[0],
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Delete failed",
      error: error.message,
    });
  }
};


module.exports = { createCart,getCart,updateCart,deleteCart };