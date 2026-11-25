const express = require("express");
const pool = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireRole("coordinator"));

// For each deadline: the teams that have not submitted yet
router.get("/pending-submissions", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.id AS deadline_id, d.title AS deadline_title, d.due_date,
              DATEDIFF(d.due_date, CURDATE()) AS days_left,
              p.id AS project_id, p.title AS project_title, t.name AS team_name
       FROM deadlines d
       CROSS JOIN projects p
       JOIN teams t ON t.id = p.team_id
       LEFT JOIN submissions s ON s.project_id = p.id AND s.deadline_id = d.id
       WHERE s.id IS NULL
       ORDER BY d.due_date, t.name`
    );

    const byDeadline = new Map();
    for (const r of rows) {
      if (!byDeadline.has(r.deadline_id)) {
        byDeadline.set(r.deadline_id, {
          deadline_id: r.deadline_id,
          title: r.deadline_title,
          due_date: r.due_date,
          days_left: r.days_left,
          overdue: r.days_left < 0,
          pending_teams: [],
        });
      }
      byDeadline.get(r.deadline_id).pending_teams.push({
        project_id: r.project_id,
        project_title: r.project_title,
        team_name: r.team_name,
      });
    }
    res.json({ deadlines: [...byDeadline.values()] });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});
// Dashboard cards for the coordinator
router.get("/summary", async (req, res) => {
  try {
    const [[row]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM teams) AS total_teams,
         (SELECT COUNT(*) FROM projects) AS total_projects,
         (SELECT COUNT(*) FROM users WHERE role = 'student') AS total_students,
         (SELECT COUNT(*) FROM users WHERE role = 'guide') AS total_guides,
         (SELECT COUNT(*) FROM deadlines
            WHERE DATEDIFF(due_date, CURDATE()) BETWEEN 0 AND 7) AS deadlines_in_7_days,
         (SELECT COUNT(*) FROM deadlines
            WHERE DATEDIFF(due_date, CURDATE()) < 0) AS overdue_deadlines,
         (SELECT COUNT(*) FROM submissions) AS total_submissions,
         (SELECT COUNT(*) FROM submissions s
            WHERE NOT EXISTS (SELECT 1 FROM feedback f WHERE f.submission_id = s.id)
         ) AS pending_reviews`
    );
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});
module.exports = router;