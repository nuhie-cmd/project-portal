const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// My notifications, newest first, plus the unread count
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, message, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC`,
      [req.user.id]
    );
    const unread = rows.filter((n) => !n.is_read).length;
    res.json({ unread, notifications: rows });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Mark all of mine as read
router.put("/read-all", async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [req.user.id]);
    res.json({ message: "All marked as read" });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Mark one as read (only if it belongs to me)
router.put("/:id/read", async (req, res) => {
  try {
    const [result] = await pool.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      [Number(req.params.id), req.user.id]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ message: "Marked as read" });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;