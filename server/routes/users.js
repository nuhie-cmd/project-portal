const express = require("express");
const pool = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

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

module.exports = router;