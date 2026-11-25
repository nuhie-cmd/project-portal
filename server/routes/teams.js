const express = require("express");
const pool = require("../db");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function findStudentTeam(user) {
  const [teams] = await pool.query(
    `SELECT t.*, g.name AS guide_name, g.email AS guide_email
     FROM teams t
     LEFT JOIN users g ON t.guide_id = g.id
     WHERE t.leader_user_id = ?
        OR LOWER(t.leader_email) = LOWER(?)
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = t.id AND LOWER(tm.member_email) = LOWER(?)
        )
     ORDER BY t.id DESC
     LIMIT 1`,
    [user.id, user.email, user.email]
  );

  if (teams.length === 0) {
    return null;
  }

  const team = teams[0];
  const [members] = await pool.query(
    `SELECT id, team_id, member_name, member_usn, member_email, role_in_team, created_at
     FROM team_members
     WHERE team_id = ?
     ORDER BY CASE WHEN role_in_team = 'leader' THEN 0 ELSE 1 END, id ASC`,
    [team.id]
  );

  return { ...team, members };
}

// GET /api/teams/my - Fetch the logged-in student's team and members
router.get("/my", authenticateToken, authorizeRoles("student"), async (req, res) => {
  try {
    const team = await findStudentTeam(req.user);
    return res.json({ team });
  } catch (err) {
    console.error("Get my team error:", err.message);
    return res.status(500).json({ message: "Unable to fetch team details." });
  }
});

// POST /api/teams - Register a new team and its members
router.post("/", authenticateToken, authorizeRoles("student"), async (req, res) => {
  const teamName = String(req.body.teamName || req.body.team || "").trim();
  const projectTitle = String(req.body.projectTitle || req.body.project || "").trim();
  const leaderInput = req.body.leader || {};
  const membersInput = Array.isArray(req.body.members) ? req.body.members : [];
  const guideId = req.body.guideId ? Number(req.body.guideId) : null;

  const leaderName = String(leaderInput.name || "").trim();
  const leaderUsn = String(leaderInput.usn || "").trim().toUpperCase();
  const leaderEmail = String(leaderInput.email || "").trim().toLowerCase();

  if (!teamName || !projectTitle) {
    return res.status(400).json({ message: "Team name and project title are required." });
  }
  if (!leaderName || !leaderUsn || !EMAIL_REGEX.test(leaderEmail)) {
    return res.status(400).json({ message: "Valid leader name, USN, and email are required." });
  }

  const normalizedMembers = [];
  const seenEmails = new Set([leaderEmail]);

  for (let i = 0; i < membersInput.length; i += 1) {
    const m = membersInput[i] || {};
    const mName = String(m.name || "").trim();
    const mUsn = String(m.usn || "").trim().toUpperCase();
    const mEmail = String(m.email || "").trim().toLowerCase();

    // Skip completely empty optional rows if any, otherwise validate every field
    if (!mName && !mUsn && !mEmail) {
      continue;
    }
    if (!mName || !mUsn || !EMAIL_REGEX.test(mEmail)) {
      return res.status(400).json({
        message: `Member ${i + 1} requires a valid name, USN, and email.`,
      });
    }
    if (seenEmails.has(mEmail)) {
      return res.status(400).json({
        message: `Duplicate email found (${mEmail}). Each team member must have a unique email.`,
      });
    }
    seenEmails.add(mEmail);
    normalizedMembers.push({ name: mName, usn: mUsn, email: mEmail });
  }

  const conn = await pool.getConnection();
  try {
    const existingTeam = await findStudentTeam(req.user);
    if (existingTeam) {
      return res.status(409).json({
        message: "You are already part of a registered team.",
        team: existingTeam,
      });
    }

    if (guideId) {
      const [guideRows] = await conn.query(
        "SELECT id FROM users WHERE id = ? AND role = 'guide'",
        [guideId]
      );
      if (guideRows.length === 0) {
        return res.status(400).json({ message: "Selected guide was not found." });
      }
    }

    await conn.beginTransaction();

    const [teamResult] = await conn.query(
      `INSERT INTO teams
       (team_name, project_title, leader_user_id, leader_name, leader_usn, leader_email, guide_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [teamName, projectTitle, req.user.id, leaderName, leaderUsn, leaderEmail, guideId]
    );

    const teamId = teamResult.insertId;

    await conn.query(
      `INSERT INTO team_members (team_id, member_name, member_usn, member_email, role_in_team)
       VALUES (?, ?, ?, ?, 'leader')`,
      [teamId, leaderName, leaderUsn, leaderEmail]
    );

    for (const member of normalizedMembers) {
      await conn.query(
        `INSERT INTO team_members (team_id, member_name, member_usn, member_email, role_in_team)
         VALUES (?, ?, ?, ?, 'member')`,
        [teamId, member.name, member.usn, member.email]
      );
    }

    await conn.commit();

    const createdTeam = await findStudentTeam(req.user);
    return res.status(201).json({
      message: "Team registered successfully.",
      team: createdTeam,
    });
  } catch (err) {
    await conn.rollback();
    console.error("Create team error:", err.message);
    return res.status(500).json({ message: "Failed to register team. Please try again." });
  } finally {
    conn.release();
  }
});

// POST /api/teams/:teamId/members - Add a member to an existing team
router.post("/:teamId/members", authenticateToken, authorizeRoles("student"), async (req, res) => {
  try {
    const teamId = Number(req.params.teamId);
    const name = String(req.body.name || "").trim();
    const usn = String(req.body.usn || "").trim().toUpperCase();
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!teamId) {
      return res.status(400).json({ message: "Invalid team ID." });
    }
    if (!name || !usn || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Valid member name, USN, and email are required." });
    }

    const [teams] = await pool.query("SELECT * FROM teams WHERE id = ?", [teamId]);
    if (teams.length === 0) {
      return res.status(404).json({ message: "Team not found." });
    }
    if (teams[0].leader_user_id !== req.user.id) {
      return res.status(403).json({ message: "Only the team leader can add team members." });
    }

    const [dup] = await pool.query(
      "SELECT id FROM team_members WHERE team_id = ? AND LOWER(member_email) = LOWER(?)",
      [teamId, email]
    );
    if (dup.length > 0) {
      return res.status(409).json({ message: "This member email is already in the team." });
    }

    await pool.query(
      `INSERT INTO team_members (team_id, member_name, member_usn, member_email, role_in_team)
       VALUES (?, ?, ?, ?, 'member')`,
      [teamId, name, usn, email]
    );

    const updatedTeam = await findStudentTeam(req.user);
    return res.status(201).json({
      message: "Team member added successfully.",
      team: updatedTeam,
    });
  } catch (err) {
    console.error("Add member error:", err.message);
    return res.status(500).json({ message: "Failed to add team member." });
  }
});

module.exports = {
  router,
  findStudentTeam,
};
