const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { JWT_SECRET, authenticateToken } = require("../middleware/auth");

const router = express.Router();
const VALID_ROLES = ["student", "guide", "coordinator"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signUserToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const role = String(req.body.role || "student").trim().toLowerCase();
    const usn = req.body.usn ? String(req.body.usn).trim().toUpperCase() : null;

    if (!name || name.length < 2) {
      return res.status(400).json({ message: "Full name must be at least 2 characters." });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role selected." });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash, role, usn) VALUES (?, ?, ?, ?, ?)",
      [name, email, passwordHash, role, usn]
    );

    const user = {
      id: result.insertId,
      name,
      email,
      role,
      usn,
    };

    const token = signUserToken(user);
    return res.status(201).json({
      message: "Registration successful.",
      token,
      user,
    });
  } catch (err) {
    console.error("Register error:", err.message);
    return res.status(500).json({ message: "Unable to register user. Please try again." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!EMAIL_REGEX.test(email) || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const [rows] = await pool.query(
      "SELECT id, name, email, password_hash, role, usn FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const dbUser = rows[0];
    const isMatch = await bcrypt.compare(password, dbUser.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      usn: dbUser.usn,
    };

    const token = signUserToken(user);
    return res.json({
      message: "Login successful.",
      token,
      user,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ message: "Unable to log in right now. Please try again." });
  }
});

// GET /api/auth/me
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, usn, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "User account not found." });
    }
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error("Profile error:", err.message);
    return res.status(500).json({ message: "Unable to load profile." });
  }
});

// GET /api/auth/guides - Available guides for assignment/selection
router.get("/guides", authenticateToken, async (_req, res) => {
  try {
    const [guides] = await pool.query(
      "SELECT id, name, email FROM users WHERE role = 'guide' ORDER BY name ASC"
    );
    return res.json({ guides });
  } catch (err) {
    console.error("Guides list error:", err.message);
    return res.status(500).json({ message: "Unable to load guides." });
  }
});

module.exports = router;
