const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /guide/teams - list teams assigned to this guide (via projects)
router.get('/teams', requireRole('guide'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.id,
              t.name AS team_name,
              p.id AS proposal_id,
              p.title AS proposal_title,
              p.status,
              u.name AS leader_name,
              u.usn AS leader_usn,
              (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count,
              g.name AS guide_name
       FROM teams t
       LEFT JOIN projects p ON p.team_id = t.id
       LEFT JOIN users u ON u.id = t.leader_id
       LEFT JOIN users g ON g.id = p.guide_id
       WHERE p.guide_id = ?`,
      [req.user.id]
    );
    res.json({ teams: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /guide/proposals - list proposals assigned to this guide
router.get('/proposals', requireRole('guide'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id,
              t.name AS team_name,
              p.title,
              p.status,
              u.name AS leader_name,
              u.usn AS leader_usn
       FROM projects p
       JOIN teams t ON t.id = p.team_id
       JOIN users u ON u.id = t.leader_id
       WHERE p.guide_id = ?`,
      [req.user.id]
    );
    res.json({ proposals: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /guide/proposals/:id - detailed proposal with members and latest feedback
router.get('/proposals/:id', requireRole('guide'), async (req, res) => {
  const proposalId = Number(req.params.id);
  try {
    // proposal info
    const [projRows] = await pool.query(
      `SELECT p.id,
              t.name AS team_name,
              p.title,
              p.description,
              p.objectives,
              p.scope,
              p.status,
              u.name AS leader_name,
              u.usn AS leader_usn,
              (SELECT comments FROM feedback f
                 JOIN submissions s ON s.id = f.submission_id
                 WHERE s.project_id = p.id
                 ORDER BY f.created_at DESC LIMIT 1) AS latest_feedback
       FROM projects p
       JOIN teams t ON t.id = p.team_id
       JOIN users u ON u.id = t.leader_id
       WHERE p.id = ?`,
      [proposalId]
    );
    if (!projRows.length) return res.status(404).json({ error: 'Proposal not found' });
    const proposal = projRows[0];
    // team members
    const [memberRows] = await pool.query(
      `SELECT u.name AS member_name, u.usn AS member_usn
       FROM team_members tm
       JOIN users u ON u.id = tm.student_id
       WHERE tm.team_id = (SELECT team_id FROM projects WHERE id = ?)`,
      [proposalId]
    );
    res.json({ proposal, members: memberRows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /guide/proposals/:id/review - approve/reject with feedback
router.post('/proposals/:id/review', requireRole('guide'), async (req, res) => {
  const proposalId = Number(req.params.id);
  const { decision, feedback } = req.body; // decision should be 'Approved' or 'Rejected'
  if (!decision || !feedback) {
    return res.status(400).json({ error: 'decision and feedback are required' });
  }
  if (!['Approved', 'Rejected'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision value' });
  }
  try {
    // Update project status
    await pool.query('UPDATE projects SET status = ? WHERE id = ?', [decision, proposalId]);
    // Find latest submission for this project (if any) to attach feedback
    const [subRows] = await pool.query(
      `SELECT id FROM submissions WHERE project_id = ? ORDER BY submitted_at DESC LIMIT 1`,
      [proposalId]
    );
    let feedbackId = null;
    if (subRows.length) {
      const [fbResult] = await pool.query(
        'INSERT INTO feedback (submission_id, guide_id, comments) VALUES (?,?,?)',
        [subRows[0].id, req.user.id, feedback]
      );
      feedbackId = fbResult.insertId;
    }
    // Simple response payload matching what the front‑end expects
    res.json({
      status: decision,
      feedback,
      message: 'Review saved',
      reviews: [],
      feedbackId,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
