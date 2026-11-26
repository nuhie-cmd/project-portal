const express = require("express");
const pool = require("../db");
// + the same auth require / router.use(...) lines as at the top of reports.js

const router = express.Router();

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";
const MODERATE_THRESHOLD = 0.45;
const HIGH_THRESHOLD = 0.7;

function buildRecommendation(matches) {
  if (!matches.length) {
    return {
      action: "proceed",
      label: "Proceed",
      message: "No similar projects found. Your idea looks distinct — you can proceed to register your project.",
    };
  }
  const top = matches[0];
  if (top.score >= HIGH_THRESHOLD) {
    return {
      action: "change",
      label: "Change topic recommended",
      message: `High similarity (${top.percent}%) with "${top.title}". Consider changing your topic or significantly narrowing your scope before submitting.`,
    };
  }
  return {
    action: "revise",
    label: "Review & differentiate",
    message: `Moderate similarity (${top.percent}%) with "${top.title}". Review the similar project(s) below and make sure your objectives and approach are distinct before proceeding.`,
  };
}

// Check a proposal against already registered projects
router.post("/check", async (req, res) => {
  const { title, description, exclude_project_id } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "title and description are required" });
  }

  try {
    // Compare against current projects and previous_projects in the database
    const [currentProjects] = await pool.query(
      `SELECT id, title, COALESCE(description, '') AS description
       FROM projects
       WHERE id <> ?`,
      [exclude_project_id || 0]
    );
    const [prevProjects] = await pool.query(
      `SELECT ('prev-' || id) AS id, title,
              TRIM(COALESCE(problem_statement, '') || ' ' || COALESCE(objectives, '')) AS description
       FROM previous_projects`
    );
    const projects = [...currentProjects, ...prevProjects];

    if (projects.length === 0) {
      return res.json({
        possible_overlap: false,
        matches: [],
        recommendation: buildRecommendation([]),
      });
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
    const matches = data.matches
      .filter((m) => m.score >= MODERATE_THRESHOLD)
      .map((m) => ({
        ...m,
        percent: Math.round(m.score * 100),
        possible_overlap: true,
        level: m.score >= HIGH_THRESHOLD ? "high" : "moderate",
      }));

    res.json({
      possible_overlap: matches.length > 0,
      matches,
      recommendation: buildRecommendation(matches),
    });
  } catch (e) {
    // Flask not running, timeout, or network error
    res.status(503).json({ error: "AI service is not available" });
  }
});

module.exports = router;