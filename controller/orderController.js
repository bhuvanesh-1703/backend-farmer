const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Cart = require("../models/Cart");
const { sendEmail } = require("../nodeMailer/mailSender");

const getOrders = async (req, res) => {
  try {
    const { userId, vendorId } = req.query;

    let filter = {};
    if (userId) {
      filter.user_id = userId;
    }

    let orders = await Order.find(filter)
      .populate("user_id", "username email phonenumber")
      .populate("products.product_id", "name image price vendor_id")
      .sort({ created_at: -1 });

    // If vendorId is provided, filter orders that contain products from that vendor
    if (vendorId) {
      orders = orders.map(order => {
        const vendorProducts = order.products.filter(item => 
          item.product_id && item.product_id.vendor_id && item.product_id.vendor_id.toString() === vendorId
        );
        if (vendorProducts.length > 0) {
          const orderObj = order.toObject();
          orderObj.products = vendorProducts;
          return orderObj;
        }
        return null;
      }).filter(Boolean);
    }

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

const placeOrder = async (req, res) => {
  try {
    const { user_id, products, payment_method, shipping_address } = req.body;

    if (!user_id || !products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order required fields missing",
      });
    }

    let totalAmount = 0;
    const orderProducts = [];

    // 1. Validate stock and calculate total
    for (const item of products) {
      const product = await Product.findById(item.product_id);

      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found (ID: ${item.product_id})` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
      }

      totalAmount += product.price * item.quantity;
      orderProducts.push({
        product_id: product._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // 2. Create the order
    const orderIdDisplay = "ORD" + Date.now();
    const newOrder = await Order.create({
      order_id: orderIdDisplay,
      user_id,
      total_amount: totalAmount,
      payment_method: payment_method || "COD",
      payment_status: "Pending",
      order_status: "Placed",
      shipping_address: shipping_address, // Mongoose handles objects
      products: orderProducts
    });

    // 3. Decrement stock
    for (const item of products) {
      await Product.findByIdAndUpdate(item.product_id, {
        $inc: { stock: -item.quantity }
      });
    }

    // Clear user cart after placing order
    await Cart.deleteMany({ user_id });

    // Send Order Confirmation Email
    try {
      const user = await User.findById(user_id);
      if (user) {
        const emailHtml = `
          <h1>Order Confirmed!</h1>
          <p>Hi ${user.username},</p>
          <p>Your order has been placed successfully.</p>
          <p><strong>Order ID:</strong> ${orderIdDisplay}</p>
          <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
          <p>Order is shipped.</p>
          <br/>
          <p>Thank you for shopping</p>
        `;
        await sendEmail(user.email, "Order Confirmation - Farmer Market", emailHtml);
      }
    } catch (mailErr) {
      console.error("Failed to send order confirmation email:", mailErr);
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: newOrder
    });
  } catch (error) {
    console.error("Place Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Order placement failed",
      error: error.message
    });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(id, { order_status }, { new: true });

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Update Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Order update failed",
    });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Order.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Delete Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Order deletion failed",
    });
  }
};

module.exports = { getOrders, placeOrder, updateOrder, deleteOrder };
