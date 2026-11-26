const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

// Helper to ensure a reminder belongs to the user (student)
function studentOnly(req, res, next) {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ error: 'Not allowed for your role' });
  }
  next();
}

// Create a reminder for a student (could be used by student or guide to set for a student)
router.post('/', requireAuth, requireRole('student'), async (req, res) => {
  const { title, message, due_at } = req.body;
  if (!title || !due_at) {
    return res.status(400).json({ error: 'title and due_at required' });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
      [req.user.id, `${title}: ${message || ''}`]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// List a student's reminders (use notifications table as simple reminder store)
router.get('/', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, message, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ reminders: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
