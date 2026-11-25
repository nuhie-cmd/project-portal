const express = require("express");
const pool = require("../db");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// GET /api/coordinator/overview - View all teams, proposals, statuses, and guides
router.get("/overview", authenticateToken, authorizeRoles("coordinator"), async (_req, res) => {
  try {
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
         p.submitted_at,
         COALESCE(ps.status, 'Not Submitted') AS status,
         ps.remarks AS latest_feedback
       FROM teams t
       LEFT JOIN users g ON t.guide_id = g.id
       LEFT JOIN project_status ps ON ps.team_id = t.id
       LEFT JOIN project_proposals p ON p.id = ps.proposal_id
       ORDER BY t.created_at DESC, t.id DESC`
    );

    const [guides] = await pool.query(
      "SELECT id, name, email FROM users WHERE role = 'guide' ORDER BY name ASC"
    );

    return res.json({ teams, guides });
  } catch (err) {
    console.error("Coordinator overview error:", err.message);
    return res.status(500).json({ message: "Unable to load coordinator overview." });
  }
});

// PATCH /api/coordinator/teams/:teamId/assign-guide - Assign a guide to a team
router.patch(
  "/teams/:teamId/assign-guide",
  authenticateToken,
  authorizeRoles("coordinator"),
  async (req, res) => {
    try {
      const teamId = Number(req.params.teamId);
      const guideId = req.body.guideId ? Number(req.body.guideId) : null;

      if (!teamId) {
        return res.status(400).json({ message: "Invalid team ID." });
      }

      const [teams] = await pool.query("SELECT id FROM teams WHERE id = ?", [teamId]);
      if (teams.length === 0) {
        return res.status(404).json({ message: "Team not found." });
      }

      if (guideId !== null) {
        const [guides] = await pool.query(
          "SELECT id FROM users WHERE id = ? AND role = 'guide'",
          [guideId]
        );
        if (guides.length === 0) {
          return res.status(400).json({ message: "Selected guide not found." });
        }
      }

      await pool.query("UPDATE teams SET guide_id = ? WHERE id = ?", [guideId, teamId]);
      return res.json({ message: "Guide assignment updated successfully." });
    } catch (err) {
      console.error("Assign guide error:", err.message);
      return res.status(500).json({ message: "Failed to assign guide." });
    }
  }
);

module.exports = router;
