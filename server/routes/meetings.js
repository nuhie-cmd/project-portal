const express = require("express");
const pool = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// Guide: schedule a meeting for one of my projects
router.post("/", requireRole("guide"), async (req, res) => {
  const projectId = Number(req.body.project_id);
  const scheduledAt = (req.body.scheduled_at || "").trim();
  const agenda = (req.body.agenda || "").trim();
  if (!projectId || !scheduledAt) {
    return res.status(400).json({ error: "project_id and scheduled_at are required" });
  }
  if (isNaN(Date.parse(scheduledAt))) {
    return res.status(400).json({ error: "scheduled_at must be a date like 2026-12-10 14:00" });
  }
  if (agenda.length > 255) return res.status(400).json({ error: "agenda is too long (max 255)" });
  try {
    const [pr] = await pool.query("SELECT id, team_id, guide_id FROM projects WHERE id = ?", [
      projectId,
    ]);
    if (!pr.length) return res.status(404).json({ error: "Project not found" });
    if (pr[0].guide_id !== req.user.id) {
      return res.status(403).json({ error: "This is not your project" });
    }
    const [result] = await pool.query(
      "INSERT INTO meetings (project_id, scheduled_at, agenda) VALUES (?,?,?)",
      [projectId, scheduledAt, agenda || null]
    );
    await pool.query(
      "INSERT INTO notifications (user_id, message) SELECT student_id, ? FROM team_members WHERE team_id = ?",
      [`Meeting scheduled for ${scheduledAt}`, pr[0].team_id]
    );
    res.status(201).json({ id: result.insertId, message: "Meeting scheduled" });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Guide: add notes after the meeting and mark it Completed
router.put("/:id/notes", requireRole("guide"), async (req, res) => {
  const notes = (req.body.notes || "").trim();
  if (!notes) return res.status(400).json({ error: "notes are required" });
  try {
    const [rows] = await pool.query(
      `SELECT m.id, p.guide_id
       FROM meetings m JOIN projects p ON p.id = m.project_id
       WHERE m.id = ?`,
      [Number(req.params.id)]
    );
    if (!rows.length) return res.status(404).json({ error: "Meeting not found" });
    if (rows[0].guide_id !== req.user.id) {
      return res.status(403).json({ error: "This is not your project" });
    }
    await pool.query("UPDATE meetings SET notes = ?, status = 'Completed' WHERE id = ?", [
      notes,
      rows[0].id,
    ]);
    res.json({ message: "Notes saved" });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Student: my team's meetings
router.get("/mine", requireRole("student"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.scheduled_at, m.agenda, m.notes, m.status
       FROM meetings m
       JOIN projects p ON p.id = m.project_id
       JOIN team_members tm ON tm.team_id = p.team_id
       WHERE tm.student_id = ?
       ORDER BY m.scheduled_at DESC`,
      [req.user.id]
    );
    res.json({ meetings: rows });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Guide: meetings of my projects
router.get("/assigned", requireRole("guide"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.project_id, p.title AS project_title, t.name AS team_name,
              m.scheduled_at, m.agenda, m.notes, m.status
       FROM meetings m
       JOIN projects p ON p.id = m.project_id
       JOIN teams t ON t.id = p.team_id
       WHERE p.guide_id = ?
       ORDER BY m.scheduled_at DESC`,
      [req.user.id]
    );
    res.json({ meetings: rows });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Coordinator: all meetings
router.get("/all", requireRole("coordinator"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.project_id, p.title AS project_title, t.name AS team_name,
              g.name AS guide_name, m.scheduled_at, m.agenda, m.notes, m.status
       FROM meetings m
       JOIN projects p ON p.id = m.project_id
       JOIN teams t ON t.id = p.team_id
       LEFT JOIN users g ON g.id = p.guide_id
       ORDER BY m.scheduled_at DESC`
    );
    res.json({ meetings: rows });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;