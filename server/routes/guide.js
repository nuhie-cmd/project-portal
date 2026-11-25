const express = require("express");
const pool = require("../db");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

function teamVisibilityClause(user) {
  if (user.role === "coordinator") {
    return { sql: "1 = 1", params: [] };
  }
  return {
    sql: "(t.guide_id = ? OR t.guide_id IS NULL)",
    params: [user.id],
  };
}

// GET /api/guide/teams - List teams assigned to the guide (or unassigned teams awaiting review)
router.get("/teams", authenticateToken, authorizeRoles("guide", "coordinator"), async (req, res) => {
  try {
    const vis = teamVisibilityClause(req.user);
    const [teams] = await pool.query(
      `SELECT
         t.id,
         t.team_name,
         t.project_title,
         t.leader_name,
         t.leader_usn,
         t.leader_email,
         t.guide_id,
         g.name AS guide_name,
         t.created_at,
         (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) AS member_count,
         p.id AS proposal_id,
         p.title AS proposal_title,
         p.submitted_at,
         COALESCE(ps.status, 'Not Submitted') AS status
       FROM teams t
       LEFT JOIN users g ON t.guide_id = g.id
       LEFT JOIN project_status ps ON ps.team_id = t.id
       LEFT JOIN project_proposals p ON p.id = ps.proposal_id
       WHERE ${vis.sql}
       ORDER BY t.created_at DESC, t.id DESC`,
      vis.params
    );

    return res.json({ teams });
  } catch (err) {
    console.error("Guide teams error:", err.message);
    return res.status(500).json({ message: "Unable to load teams." });
  }
});

// GET /api/guide/proposals - List submitted proposals visible to the guide
router.get("/proposals", authenticateToken, authorizeRoles("guide", "coordinator"), async (req, res) => {
  try {
    const vis = teamVisibilityClause(req.user);
    const [proposals] = await pool.query(
      `SELECT
         p.*,
         t.team_name,
         t.project_title,
         t.leader_name,
         t.leader_usn,
         t.leader_email,
         t.guide_id,
         COALESCE(ps.status, 'Pending') AS status,
         ps.remarks AS latest_feedback,
         ps.updated_at AS status_updated_at
       FROM project_proposals p
       JOIN teams t ON p.team_id = t.id
       JOIN project_status ps ON ps.proposal_id = p.id
       WHERE ${vis.sql}
       ORDER BY
         CASE WHEN ps.status = 'Pending' THEN 0 ELSE 1 END,
         p.submitted_at DESC,
         p.id DESC`,
      vis.params
    );

    return res.json({ proposals });
  } catch (err) {
    console.error("Guide proposals error:", err.message);
    return res.status(500).json({ message: "Unable to load proposals." });
  }
});

// GET /api/guide/proposals/:id - View a specific proposal with members & review history
router.get("/proposals/:id", authenticateToken, authorizeRoles("guide", "coordinator"), async (req, res) => {
  try {
    const proposalId = Number(req.params.id);
    if (!proposalId) {
      return res.status(400).json({ message: "Invalid proposal ID." });
    }

    const [rows] = await pool.query(
      `SELECT
         p.*,
         t.team_name,
         t.project_title,
         t.leader_name,
         t.leader_usn,
         t.leader_email,
         t.guide_id,
         g.name AS guide_name,
         COALESCE(ps.status, 'Pending') AS status,
         ps.remarks AS latest_feedback
       FROM project_proposals p
       JOIN teams t ON p.team_id = t.id
       LEFT JOIN users g ON t.guide_id = g.id
       LEFT JOIN project_status ps ON ps.proposal_id = p.id
       WHERE p.id = ?`,
      [proposalId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Proposal not found." });
    }

    const proposal = rows[0];
    if (
      req.user.role === "guide" &&
      proposal.guide_id !== null &&
      proposal.guide_id !== req.user.id
    ) {
      return res.status(403).json({
        message: "Access denied. This team is assigned to another guide.",
      });
    }

    const [members] = await pool.query(
      `SELECT id, member_name, member_usn, member_email, role_in_team
       FROM team_members
       WHERE team_id = ?
       ORDER BY CASE WHEN role_in_team = 'leader' THEN 0 ELSE 1 END, id ASC`,
      [proposal.team_id]
    );

    const [reviews] = await pool.query(
      `SELECT gr.*, u.name AS guide_name
       FROM guide_reviews gr
       JOIN users u ON gr.guide_id = u.id
       WHERE gr.proposal_id = ?
       ORDER BY gr.reviewed_at DESC, gr.id DESC`,
      [proposalId]
    );

    return res.json({ proposal, members, reviews });
  } catch (err) {
    console.error("Guide proposal detail error:", err.message);
    return res.status(500).json({ message: "Unable to load proposal details." });
  }
});

// POST /api/guide/proposals/:id/review - Approve or reject a proposal with guide feedback
router.post("/proposals/:id/review", authenticateToken, authorizeRoles("guide"), async (req, res) => {
  const proposalId = Number(req.params.id);
  const decision = String(req.body.decision || req.body.status || "").trim();
  const feedback = String(req.body.feedback || "").trim();

  if (!proposalId) {
    return res.status(400).json({ message: "Invalid proposal ID." });
  }
  if (!["Approved", "Rejected"].includes(decision)) {
    return res.status(400).json({ message: "Decision must be either 'Approved' or 'Rejected'." });
  }
  if (!feedback) {
    return res.status(400).json({ message: "Please provide guide feedback before submitting." });
  }

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT p.id, p.team_id, t.guide_id
       FROM project_proposals p
       JOIN teams t ON p.team_id = t.id
       WHERE p.id = ?`,
      [proposalId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Proposal not found." });
    }

    const proposal = rows[0];
    if (proposal.guide_id !== null && proposal.guide_id !== req.user.id) {
      return res.status(403).json({
        message: "Access denied. This team is assigned to another guide.",
      });
    }

    await conn.beginTransaction();

    if (proposal.guide_id === null) {
      await conn.query("UPDATE teams SET guide_id = ? WHERE id = ?", [req.user.id, proposal.team_id]);
    }

    await conn.query(
      `INSERT INTO guide_reviews (proposal_id, guide_id, decision, feedback)
       VALUES (?, ?, ?, ?)`,
      [proposalId, req.user.id, decision, feedback]
    );

    await conn.query(
      `INSERT INTO project_status (proposal_id, team_id, status, remarks, updated_by)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         proposal_id = VALUES(proposal_id),
         status = VALUES(status),
         remarks = VALUES(remarks),
         updated_by = VALUES(updated_by)`,
      [proposalId, proposal.team_id, decision, feedback, req.user.id]
    );

    await conn.commit();

    const [reviews] = await pool.query(
      `SELECT gr.*, u.name AS guide_name
       FROM guide_reviews gr
       JOIN users u ON gr.guide_id = u.id
       WHERE gr.proposal_id = ?
       ORDER BY gr.reviewed_at DESC, gr.id DESC`,
      [proposalId]
    );

    return res.json({
      message: `Proposal ${decision.toLowerCase()} successfully.`,
      status: decision,
      feedback,
      reviews,
    });
  } catch (err) {
    await conn.rollback();
    console.error("Guide review error:", err.message);
    return res.status(500).json({ message: "Failed to save guide review." });
  } finally {
    conn.release();
  }
});

module.exports = router;
