const express = require("express");
const pool = require("../db");
// + the same auth require / router.use(...) lines as at the top of reports.js

const router = express.Router();

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";
const OVERLAP_THRESHOLD = 0.5; // same value the React page uses

// Check a proposal against already registered projects
router.post("/check", async (req, res) => {
  const { title, description, exclude_project_id } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "title and description are required" });
  }

  try {
    // Only previously registered projects. Exclude the one being checked,
    // or it would match itself with a score near 1.0.
    const [projects] = await pool.query(
      `SELECT id, title, COALESCE(description, '') AS description
       FROM projects
       WHERE id <> ?`,
      [exclude_project_id || 0]
    );

    // With no projects, skip the call: an empty list would make the
    // Python service fall back to its 4 built-in sample projects.
    if (projects.length === 0) {
      return res.json({ possible_overlap: false, matches: [] });
    }

    const aiRes = await fetch(`${AI_URL}/similar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, projects }),
      signal: AbortSignal.timeout(10000),
    });
    if (!aiRes.ok) {
      return res.status(502).json({ error: "AI service returned an error" });
    }

    const data = await aiRes.json();
    const matches = data.matches.map((m) => ({
      ...m,
      percent: Math.round(m.score * 100),
      possible_overlap: m.score >= OVERLAP_THRESHOLD,
    }));

    res.json({
      possible_overlap: matches.some((m) => m.possible_overlap),
      matches,
    });
  } catch (e) {
    // Flask not running, timeout, or network error
    res.status(503).json({ error: "AI service is not available" });
  }
});

module.exports = router;