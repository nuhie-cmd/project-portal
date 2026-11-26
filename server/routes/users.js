const express = require("express");
const pool = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const bcrypt = require("bcrypt");

const router = express.Router();
router.use(requireAuth);

router.get("/", requireRole("coordinator"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, usn, created_at FROM users ORDER BY role, id"
    );
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/guides", requireRole("coordinator"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.max_teams, COUNT(p.id) AS allocated
       FROM users u LEFT JOIN projects p ON p.guide_id = u.id
       WHERE u.role = 'guide'
       GROUP BY u.id`
    );
    res.json({ guides: rows });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

function coordinatorOnly(req, res, next) {
  if (!req.user || req.user.role !== "coordinator") {
    return res.status(403).json({ error: "Not allowed for your role" });
  }
  next();
}

router.post("/guides", requireAuth, coordinatorOnly, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,'guide')",
      [name, email.toLowerCase(), hash]
    );
    res.status(201).json({ id: result.insertId, name, email: email.toLowerCase(), role: "guide" });
  } catch (err) {
    if (err.message && err.message.includes("UNIQUE")) {
      return res.status(409).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/reset-password", requireAuth, coordinatorOnly, async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 8) {
    return res.status(400).json({ error: "new_password must be at least 8 characters" });
  }
  try {
    const hash = await bcrypt.hash(new_password, 10);
    const [result] = await pool.query(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [hash, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "Password reset" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
