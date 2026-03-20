const nodemailer = require('nodemailer');

const dotenv = require('dotenv')
dotenv.config()

// console.log("EMAIL USER:", process.env.EMAIL_USER);
// console.log("EMAIL PASS:", process.env.EMAIL_PASS ? "Loaded" : "Missing");

const transport = nodemailer.createTransport({
   
    service:"gmail",            
    secure: false,           
    auth: {
        user: process.env.EMAIL_USER,  
        pass: process.env.EMAIL_PASS,  
    },
});



const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `Farmer Market <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transport.sendMail(mailOptions);
    // console.log("Email sent:", info.messageId);
    return { success: true, info };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

const orderSuccessMail = async (req, res) => {
  try {
    const { toMail, order } = req.body;
    // console.log("Request body:", req.body);

    const html = `
        <h2>Thanks For Your Order</h2>
        <p>Your order has been placed successfully.</p>
        <p><strong>Order ID:</strong> ${order.order_id || "N/A"}</p>
        <p><strong>Total Amount:</strong> ₹${order.total_amount || "N/A"}</p>
        <h2>Thank You</h2>
    `;

    const result = await sendEmail(toMail, "Order Placed Successfully", html);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error("Error in orderSuccessMail controller:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { sendEmail, orderSuccessMail };
