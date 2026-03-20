const db = require("../DB_connection/db");

const getNotifications = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const [notifications] = await db.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications", error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = ?",
      [id]
    );

    res.status(200).json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark Notification As Read Error:", error);
    res.status(500).json({ success: false, message: "Failed to update notification", error: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "DELETE FROM notifications WHERE id = ?",
      [id]
    );

    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Delete Notification Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete notification", error: error.message });
  }
};

module.exports = { getNotifications, markAsRead, deleteNotification };
