const Cart = require("../models/Cart");
const User = require("../models/User");
const Product = require("../models/Product");

const createCart = async (req, res) => {
  try {
    const { productId, userId, quantity } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ success: false, message: "User ID and Product ID are required." });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(401).json({ success: false, message: "User not found. Please log in again." });
    }

    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    let cartItem = await Cart.findOne({ product_id: productId, user_id: userId });

    if (cartItem) {
      cartItem.quantity += (quantity || 1);
      await cartItem.save();

      return res.status(200).json({
        success: true,
        message: "Cart quantity updated",
        data: cartItem,
      });
    }

    const newCart = await Cart.create({
      product_id: productId,
      user_id: userId,
      quantity: quantity || 1
    });

    res.status(201).json({
      success: true,
      message: "Product added to cart",
      data: newCart,
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

    const cart = await Cart.find({ user_id: userId })
      .populate({
        path: "product_id",
        populate: { path: "categories_id" }
      });

    // Transform for frontend compatibility if needed
    const transformedCart = cart.map(item => {
        const obj = item.toObject();
        if (obj.product_id) {
            obj.name = obj.product_id.name;
            obj.price = obj.product_id.price;
            obj.image = obj.product_id.image;
            if (obj.product_id.categories_id) {
                obj.category_name = obj.product_id.categories_id.category_name;
            }
        }
        return obj;
    });

    res.status(200).json({
      success: true,
      count: cart.length,
      data: transformedCart,
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

    const updatedCart = await Cart.findByIdAndUpdate(id, { quantity }, { new: true });

    if (!updatedCart) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Quantity updated",
      data: updatedCart,
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

    const result = await Cart.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product removed",
      data: result,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Delete failed",
      error: error.message,
    });
  }
};


module.exports = { createCart, getCart, updateCart, deleteCart };