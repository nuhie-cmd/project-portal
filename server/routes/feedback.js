const express = require("express");
const pool = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.post("/", requireRole("guide"), async (req, res) => {
  const submissionId = Number(req.body.submission_id);
  const comments = (req.body.comments || "").trim();
  if (!submissionId || !comments) {
    return res.status(400).json({ error: "submission_id and comments are required" });
  }
  try {
    const [rows] = await pool.query(
      `SELECT p.guide_id, p.team_id, d.title AS deadline_title
       FROM submissions s
       JOIN projects p ON p.id = s.project_id
       JOIN deadlines d ON d.id = s.deadline_id
       WHERE s.id = ?`,
      [submissionId]
    );
    if (!rows.length) return res.status(404).json({ error: "Submission not found" });
    if (rows[0].guide_id !== req.user.id) {
      return res.status(403).json({ error: "This is not your project" });
    }

    const [result] = await pool.query(
      "INSERT INTO feedback (submission_id, guide_id, comments) VALUES (?,?,?)",
      [submissionId, req.user.id, comments]
    );
    await pool.query(
      "INSERT INTO notifications (user_id, message) SELECT student_id, ? FROM team_members WHERE team_id = ?",
      [`New feedback on "${rows[0].deadline_title}"`, rows[0].team_id]
    );
    res.status(201).json({ id: result.insertId, message: "Feedback saved" });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;