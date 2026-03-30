const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema({
  order_id: {
    type: String, // String like "ORD..."
    required: true,
    unique: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  total_amount: {
    type: Number,
    required: true,
  },
  payment_method: {
    type: String,
    enum: ["COD", "Online"],
    default: "COD",
  },
  payment_status: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Pending",
  },
  order_status: {
    type: String,
    enum: ["Placed", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    default: "Placed",
  },
  shipping_address: {
    type: Object, // Embedded address object
    required: true,
  },
  products: [orderItemSchema], // Embedded order items
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model("Order", orderSchema);
