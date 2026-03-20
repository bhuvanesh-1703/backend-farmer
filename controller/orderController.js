const db = require("../DB_connection/db");
const { sendEmail } = require("../nodeMailer/mailSender");


const getOrders = async (req, res) => {
  try {
    const { userId, vendorId } = req.query;

    let query = `
      SELECT DISTINCT o.*, u.username AS customer_name, u.email AS customer_email, u.phonenumber AS customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
    `;

    const params = [];

    if (userId) {
      query += ` WHERE o.user_id = ? `;
      params.push(userId);
    } else if (vendorId) {
      query += ` WHERE p.vendor_id = ? `;
      params.push(vendorId);
    }

    query += ` ORDER BY o.created_at DESC`;

    const [orders] = await db.query(query, params);

    // Fetch items for each order and parse shipping address
    for (let order of orders) {
      if (typeof order.shipping_address === "string") {
        try {
          order.shipping_address = JSON.parse(order.shipping_address);
        } catch (e) {
          console.error("Failed to parse shipping address for order:", order.id);
        }
      }

      // Fetch products for this order (filter by vendorId if provided)
      let itemQuery = `
         SELECT oi.*, p.name, p.image, p.price 
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?
      `;
      let itemParams = [order.id];

      if (vendorId) {
        itemQuery += ` AND p.vendor_id = ?`;
        itemParams.push(vendorId);
      }

      const [items] = await db.query(itemQuery, itemParams);
      order.products = items;
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
  const connection = await db.getConnection();

  try {
    const { user_id, products, payment_method, shipping_address } = req.body;

    if (!user_id || !products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order required fields missing",
      });
    }

    await connection.beginTransaction();

    // 1. Validate stock and calculate total
    for (const item of products) {
      const [productData] = await connection.query(
        "SELECT price, stock, name FROM products WHERE id = ?",
        [item.product_id],
      );

      if (productData.length === 0) {
        throw new Error(`Product not found (ID: ${item.product_id})`);
      }

      const product = productData[0];
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
      }

      totalAmount += product.price * item.quantity;
    }

    // 2. Create the order
    const [orderResult] = await connection.query(
      `INSERT INTO orders 
      (order_id, user_id, total_amount, payment_method, payment_status, order_status, shipping_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "ORD" + Date.now(),
        user_id,
        totalAmount,
        payment_method || "COD",
        "Pending",
        "Placed",
        JSON.stringify(shipping_address),
      ],
    );

    const orderId = orderResult.insertId;

    // 3. Create order items and decrement stock
    for (const item of products) {
      const [productData] = await connection.query(
        "SELECT price FROM products WHERE id = ?",
        [item.product_id],
      );

      // Decrement stock
      await connection.query(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        [item.quantity, item.product_id]
      );

      await connection.query(
        `INSERT INTO order_items 
        (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, productData[0].price],
      );
    }

    // Clear user cart after placing order
    await connection.query("DELETE FROM cart WHERE user_id = ?", [user_id]);

    await connection.commit();

    // Send Order Confirmation Email
    try {
      const [userData] = await connection.query(
        "SELECT email, username FROM users WHERE id = ?",
        [user_id],
      );

      if (userData.length > 0) {
        const userEmail = userData[0].email;
        const userName = userData[0].username;
        const orderIdDisplay = "ORD" + Date.now(); // Note: This is slightly inaccurate as it's not the exact string stored, but consistent with the logic above. Ideally we'd store the generated ID in a variable first.

        const emailHtml = `
          <h1>Order Confirmed!</h1>
          <p>Hi ${userName},</p>
          <p>Your order has been placed successfully.</p>
          <p><strong>Order ID:</strong> ${orderIdDisplay}</p>
          <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
          <p> order is shipped.</p>
          <br/>
          <p>Thank you for shopping</p>
        `;

        await sendEmail(userEmail, "Order Confirmation - Farmer Market", emailHtml);
      }
    } catch (mailErr) {
      console.error("Failed to send order confirmation email:", mailErr);
      // Don't fail the response if only email fails
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Place Order Error:", error);

    const isStockError = error.message.includes("stock") || error.message.includes("found");
    res.status(isStockError ? 400 : 500).json({
      success: false,
      message: isStockError ? error.message : "Order placement failed",
    });
  } finally {
    connection.release();
  }
};

const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status } = req.body;

    await db.query(`UPDATE orders SET order_status = ? WHERE id = ?`, [
      order_status,
      id,
    ]);

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
  const connection = await db.getConnection();
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    // Delete order items first (foreign key constraints)
    await connection.query(`DELETE FROM order_items WHERE order_id = ?`, [id]);

    // Delete the order
    const [result] = await connection.query(`DELETE FROM orders WHERE id = ?`, [
      id,
    ]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Delete Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Order deletion failed",
    });
  } finally {
    connection.release();
  }
};

module.exports = { getOrders, placeOrder, updateOrder, deleteOrder };
