const express = require("express");
const pool = require("../db");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { findStudentTeam } = require("./teams");

const router = express.Router();

// GET /api/proposals/my - Fetch student's team, latest proposal, status, and guide feedback
router.get("/my", authenticateToken, authorizeRoles("student"), async (req, res) => {
  try {
    const team = await findStudentTeam(req.user);
    if (!team) {
      return res.json({
        team: null,
        proposal: null,
        status: null,
        latestReview: null,
        reviews: [],
      });
    }

    const [proposals] = await pool.query(
      `SELECT p.*, ps.status AS current_status, ps.remarks, ps.updated_at AS status_updated_at
       FROM project_proposals p
       LEFT JOIN project_status ps ON ps.proposal_id = p.id
       WHERE p.team_id = ?
       ORDER BY p.id DESC
       LIMIT 1`,
      [team.id]
    );

    if (proposals.length === 0) {
      return res.json({
        team,
        proposal: null,
        status: null,
        latestReview: null,
        reviews: [],
      });
    }

    const proposal = proposals[0];
    const [reviews] = await pool.query(
      `SELECT gr.*, u.name AS guide_name, u.email AS guide_email
       FROM guide_reviews gr
       JOIN users u ON gr.guide_id = u.id
       WHERE gr.proposal_id = ?
       ORDER BY gr.reviewed_at DESC, gr.id DESC`,
      [proposal.id]
    );

    return res.json({
      team,
      proposal,
      status: proposal.current_status || "Pending",
      latestReview: reviews[0] || null,
      reviews,
    });
  } catch (err) {
    console.error("Get my proposal error:", err.message);
    return res.status(500).json({ message: "Unable to load project status." });
  }
});

// POST /api/proposals - Submit a project proposal for the student's team
router.post("/", authenticateToken, authorizeRoles("student"), async (req, res) => {
  const title = String(req.body.title || "").trim();
  const problemStatement = String(req.body.problemStatement || req.body.problem || "").trim();
  const objectives = String(req.body.objectives || "").trim();
  const technologiesUsed = String(req.body.technologiesUsed || req.body.technology || "").trim();
  const description = String(req.body.description || "").trim();

  if (!title || !problemStatement || !objectives || !technologiesUsed || !description) {
    return res.status(400).json({ message: "All proposal fields are required." });
  }

  const conn = await pool.getConnection();
  try {
    const team = await findStudentTeam(req.user);
    if (!team) {
      return res.status(400).json({
        message: "Please register your team before submitting a project proposal.",
      });
    }

    const [existingStatus] = await conn.query(
      "SELECT status FROM project_status WHERE team_id = ?",
      [team.id]
    );

    if (
      existingStatus.length > 0 &&
      (existingStatus[0].status === "Pending" || existingStatus[0].status === "Approved")
    ) {
      return res.status(409).json({
        message: `Your team already has a proposal with status "${existingStatus[0].status}".`,
      });
    }

    await conn.beginTransaction();

    const [proposalResult] = await conn.query(
      `INSERT INTO project_proposals
       (team_id, submitted_by, title, problem_statement, objectives, technologies_used, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [team.id, req.user.id, title, problemStatement, objectives, technologiesUsed, description]
    );

    const proposalId = proposalResult.insertId;

    await conn.query(
      `INSERT INTO project_status (proposal_id, team_id, status, remarks, updated_by)
       VALUES (?, ?, 'Pending', NULL, ?)
       ON DUPLICATE KEY UPDATE
         proposal_id = VALUES(proposal_id),
         status = 'Pending',
         remarks = NULL,
         updated_by = VALUES(updated_by)`,
      [proposalId, team.id, req.user.id]
    );

    await conn.query("UPDATE teams SET project_title = ? WHERE id = ?", [title, team.id]);

    await conn.commit();

    const [rows] = await pool.query("SELECT * FROM project_proposals WHERE id = ?", [proposalId]);
    return res.status(201).json({
      message: "Project proposal submitted successfully.",
      proposal: rows[0],
      status: "Pending",
    });
  } catch (err) {
    await conn.rollback();
    console.error("Submit proposal error:", err.message);
    return res.status(500).json({ message: "Failed to submit project proposal." });
  } finally {
    conn.release();
  }
});

module.exports = router;
