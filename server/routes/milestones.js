const express = require("express");
const pool = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const STATUSES = ["Not Started", "In Progress", "Done"];

// Student: list my project's milestones
router.get("/mine", requireRole("student"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.project_id, m.title, m.status, m.updated_at
       FROM milestones m
       JOIN projects p ON p.id = m.project_id
       JOIN team_members tm ON tm.team_id = p.team_id
       WHERE tm.student_id = ?
       ORDER BY m.id ASC`,
      [req.user.id]
    );
    res.json({ milestones: rows });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Guide: list milestones for assigned projects
router.get("/assigned", requireRole("guide"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.project_id, p.title AS project_title, t.name AS team_name,
              m.title, m.status, m.updated_at
       FROM milestones m
       JOIN projects p ON p.id = m.project_id
       JOIN teams t ON t.id = p.team_id
       WHERE p.guide_id = ?
       ORDER BY p.id ASC, m.id ASC`,
      [req.user.id]
    );
    res.json({ milestones: rows });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Student: create a milestone for my project
router.post("/", requireRole("student"), async (req, res) => {
  const title = (req.body.title || "").trim();
  if (!title) return res.status(400).json({ error: "Title is required" });
  try {
    const [p] = await pool.query(
      `SELECT p.id FROM projects p
       JOIN team_members tm ON tm.team_id = p.team_id
       WHERE tm.student_id = ?`,
      [req.user.id]
    );
    if (!p.length) return res.status(403).json({ error: "Register your project first" });
    const [result] = await pool.query(
      "INSERT INTO milestones (project_id, title) VALUES (?, ?)",
      [p[0].id, title]
    );
    res.status(201).json({ id: result.insertId, title, status: "Not Started" });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Student (own project) or Guide (assigned project): update milestone status
router.put("/:id", requireRole("student", "guide"), async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${STATUSES.join(", ")}` });
  }
  try {
    const [rows] = await pool.query(
      `SELECT m.id, p.team_id, p.guide_id
       FROM milestones m JOIN projects p ON p.id = m.project_id
       WHERE m.id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "Milestone not found" });

    if (req.user.role === "guide" && rows[0].guide_id !== req.user.id) {
      return res.status(403).json({ error: "This is not your project" });
    }
    if (req.user.role === "student") {
      const [m] = await pool.query(
        "SELECT 1 FROM team_members WHERE team_id = ? AND student_id = ?",
        [rows[0].team_id, req.user.id]
      );
      if (!m.length) return res.status(403).json({ error: "Not your team's milestone" });
    }

    await pool.query(
      "UPDATE milestones SET status = ?, updated_at = datetime('now') WHERE id = ?",
      [status, id]
    );
    res.json({ message: "Milestone updated" });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
