const express = require("express");
const pool = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const STATUSES = ["Pending", "Approved", "In Progress", "Completed"];

// Student (team leader) registers the project
router.post("/", requireRole("student"), async (req, res) => {
  const { title, description, objectives, scope } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required" });
  }
  try {
    const [teams] = await pool.query("SELECT id FROM teams WHERE leader_id = ?", [req.user.id]);
    if (!teams.length) {
      return res.status(403).json({ error: "Only a team leader can register a project" });
    }
    const [result] = await pool.query(
      "INSERT INTO projects (team_id, title, description, objectives, scope) VALUES (?,?,?,?,?)",
      [teams[0].id, title, description, objectives || null, scope || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Your team already has a project" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// Student sees their team's project
router.get("/mine", requireRole("student"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, t.name AS team_name, g.name AS guide_name
       FROM projects p
       JOIN teams t ON t.id = p.team_id
       JOIN team_members tm ON tm.team_id = t.id
       LEFT JOIN users g ON g.id = p.guide_id
       WHERE tm.student_id = ?`,
      [req.user.id]
    );
    res.json({ project: rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Guide sees projects assigned to them
router.get("/assigned", requireRole("guide"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, t.name AS team_name
       FROM projects p JOIN teams t ON t.id = p.team_id
       WHERE p.guide_id = ?`,
      [req.user.id]
    );
    res.json({ projects: rows });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Coordinator sees all projects
router.get("/", requireRole("coordinator"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.title, p.status, p.guide_id, t.name AS team_name, g.name AS guide_name,
              (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
       FROM projects p
       JOIN teams t ON t.id = p.team_id
       LEFT JOIN users g ON g.id = p.guide_id`
    );
    res.json({ projects: rows });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Coordinator allocates a guide (max 4 groups per guide)
router.put("/:id/guide", requireRole("coordinator"), async (req, res) => {
  const projectId = Number(req.params.id);
  const guideId = Number(req.body.guideId);
  if (!guideId) return res.status(400).json({ error: "guideId is required" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [projects] = await conn.query(
      "SELECT id, guide_id FROM projects WHERE id = ? FOR UPDATE",
      [projectId]
    );
    if (!projects.length) {
      await conn.rollback();
      return res.status(404).json({ error: "Project not found" });
    }
    if (projects[0].guide_id === guideId) {
      await conn.rollback();
      return res.json({ message: "Guide already allocated" });
    }

    const [guides] = await conn.query(
      "SELECT max_teams FROM users WHERE id = ? AND role = 'guide' FOR UPDATE",
      [guideId]
    );
    if (!guides.length) {
      await conn.rollback();
      return res.status(404).json({ error: "Guide not found" });
    }

    const [[count]] = await conn.query(
      "SELECT COUNT(*) AS n FROM projects WHERE guide_id = ?",
      [guideId]
    );
    if (count.n >= guides[0].max_teams) {
      await conn.rollback();
      return res.status(400).json({
        error: `This guide already has ${guides[0].max_teams} groups`,
      });
    }

    await conn.query("UPDATE projects SET guide_id = ? WHERE id = ?", [guideId, projectId]);
    await conn.commit();
    res.json({ message: "Guide allocated" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: "Server error" });
  } finally {
    conn.release();
  }
});

// Guide (own projects) or coordinator updates status
router.put("/:id/status", requireRole("guide", "coordinator"), async (req, res) => {
  const projectId = Number(req.params.id);
  const { status } = req.body;
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${STATUSES.join(", ")}` });
  }
  try {
    const [rows] = await pool.query("SELECT guide_id FROM projects WHERE id = ?", [projectId]);
    if (!rows.length) return res.status(404).json({ error: "Project not found" });
    if (req.user.role === "guide" && rows[0].guide_id !== req.user.id) {
      return res.status(403).json({ error: "This is not your project" });
    }
    await pool.query("UPDATE projects SET status = ? WHERE id = ?", [status, projectId]);
    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;