const Message = require("../models/Message");
const Notification = require("../models/Notification");
const { sendEmail } = require("../nodeMailer/mailSender");

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ created_at: -1 });
    res.status(200).json({ success: true, message: "Messages fetched successfully", messages });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch messages", error: error.message });
  }
};

const postMessage = async (req, res) => {
  try {
    const { name, email, phone, message, userId } = req.body;
    
    const newMessage = await Message.create({
      name,
      email,
      phone,
      message,
      user_id: userId || null
    });

    const userEmailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #2e7d32;">Hello ${name},</h2>
        <p>Thank you for reaching out to us. We have received your message. Our team will review it and get back to you at <strong>${phone}</strong> or via email as soon as possible.</p>
        <br/>
        <p>Best Regards,</p>
        <p><strong>Farmer Market Team</strong></p>
      </div>
    `;

    await sendEmail(email, "Message Received - Farmer Market", userEmailHtml);

    res.status(201).json({ success: true, message: "Message sent successfully and confirmation email sent" });
  } catch (error) {
    console.error("Post Message Error:", error);
    res.status(500).json({ success: false, message: "Failed to send message", error: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Message.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    res.status(200).json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete message", error: error.message });
  }
};

const replyToMessage = async (req, res) => {
  try {
    const { userId, messageId, content } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ success: false, message: "User ID and content are required" });
    }

    await Notification.create({
      user_id: userId,
      message_id: messageId || null,
      content: content
    });

    res.status(201).json({ success: true, message: "Reply sent to user notifications" });
  } catch (error) {
    console.error("Reply To Message Error:", error);
    res.status(500).json({ success: false, message: "Failed to send reply", error: error.message });
  }
};

module.exports = { getMessages, postMessage, deleteMessage, replyToMessage };
