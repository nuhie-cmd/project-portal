const express = require("express");
const pool = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const MAX_TEAM_SIZE = 4;

// Student creates a team (becomes leader and first member)
router.post("/", requireRole("student"), async (req, res) => {
  const name = (req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Team name is required" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.query(
      "SELECT 1 FROM team_members WHERE student_id = ?",
      [req.user.id]
    );
    if (existing.length) {
      await conn.rollback();
      return res.status(409).json({ error: "You are already in a team" });
    }
    const [result] = await conn.query(
      "INSERT INTO teams (name, leader_id) VALUES (?, ?)",
      [name, req.user.id]
    );
    await conn.query(
      "INSERT INTO team_members (team_id, student_id) VALUES (?, ?)",
      [result.insertId, req.user.id]
    );
    await conn.commit();
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: "Server error" });
  } finally {
    conn.release();
  }
});

// Leader adds a member by USN
router.post("/:id/members", requireRole("student"), async (req, res) => {
  const teamId = Number(req.params.id);
  const usn = (req.body.usn || "").trim();
  if (!usn) return res.status(400).json({ error: "USN is required" });

  try {
    const [teams] = await pool.query("SELECT * FROM teams WHERE id = ?", [teamId]);
    const team = teams[0];
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (team.leader_id !== req.user.id) {
      return res.status(403).json({ error: "Only the team leader can add members" });
    }

    const [[count]] = await pool.query(
      "SELECT COUNT(*) AS n FROM team_members WHERE team_id = ?",
      [teamId]
    );
    if (count.n >= MAX_TEAM_SIZE) {
      return res.status(400).json({ error: `A team can have at most ${MAX_TEAM_SIZE} members` });
    }

    const [students] = await pool.query(
      "SELECT id, name FROM users WHERE usn = ? AND role = 'student'",
      [usn]
    );
    if (!students.length) return res.status(404).json({ error: "No student with that USN" });

    await pool.query(
      "INSERT INTO team_members (team_id, student_id) VALUES (?, ?)",
      [teamId, students[0].id]
    );
    res.status(201).json({ message: `${students[0].name} added to the team` });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "That student is already in a team" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// Student sees their own team and members
router.get("/mine", requireRole("student"), async (req, res) => {
  try {
    const [teams] = await pool.query(
      `SELECT t.id, t.name, t.leader_id
       FROM teams t JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.student_id = ?`,
      [req.user.id]
    );
    if (!teams.length) return res.json({ team: null });

    const [members] = await pool.query(
      `SELECT u.id, u.name, u.usn
       FROM team_members tm JOIN users u ON u.id = tm.student_id
       WHERE tm.team_id = ?`,
      [teams[0].id]
    );
    res.json({ team: { ...teams[0], members } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;