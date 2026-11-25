const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const pool = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const SERVER_DIR = path.join(__dirname, "..");
const UPLOAD_DIR = path.join(SERVER_DIR, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".zip"];

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED.includes(ext)) return cb(null, true);
    cb(new Error(`Allowed file types: ${ALLOWED.join(", ")}`));
  },
});

function removeFile(file) {
  if (file) fs.unlink(file.path, () => {});
}

// Attach the guide's feedback list to each submission row
async function withFeedback(rows) {
  if (!rows.length) return rows;
  const [fb] = await pool.query(
    `SELECT f.id, f.submission_id, f.comments, f.created_at, u.name AS guide_name
     FROM feedback f JOIN users u ON u.id = f.guide_id
     WHERE f.submission_id IN (?) ORDER BY f.created_at`,
    [rows.map((r) => r.id)]
  );
  return rows.map((r) => ({ ...r, feedback: fb.filter((f) => f.submission_id === r.id) }));
}

// Can this user see this project's submissions?
async function canSeeProject(user, project) {
  if (user.role === "coordinator") return true;
  if (user.role === "guide") return project.guide_id === user.id;
  const [m] = await pool.query(
    "SELECT 1 FROM team_members WHERE team_id = ? AND student_id = ?",
    [project.team_id, user.id]
  );
  return m.length > 0;
}

// Student uploads a file for a deadline
router.post("/", requireRole("student"), (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const deadlineId = Number(req.body.deadline_id);
    if (!req.file || !deadlineId) {
      removeFile(req.file);
      return res.status(400).json({ error: "deadline_id and file are required" });
    }
    try {
      const [p] = await pool.query(
        `SELECT p.id FROM projects p
         JOIN team_members tm ON tm.team_id = p.team_id
         WHERE tm.student_id = ?`,
        [req.user.id]
      );
      if (!p.length) {
        removeFile(req.file);
        return res.status(403).json({ error: "Register your project before submitting" });
      }
      const [d] = await pool.query("SELECT id FROM deadlines WHERE id = ?", [deadlineId]);
      if (!d.length) {
        removeFile(req.file);
        return res.status(404).json({ error: "Deadline not found" });
      }
      const [result] = await pool.query(
        "INSERT INTO submissions (project_id, deadline_id, file_path) VALUES (?,?,?)",
        [p[0].id, deadlineId, `uploads/${req.file.filename}`]
      );
      res.status(201).json({ id: result.insertId, message: "Submitted" });
    } catch (e) {
      removeFile(req.file);
      res.status(500).json({ error: "Server error" });
    }
  });
});

// Student: my team's submissions with feedback
router.get("/mine", requireRole("student"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.deadline_id, d.title AS deadline_title, s.submitted_at
       FROM submissions s
       JOIN projects p ON p.id = s.project_id
       JOIN team_members tm ON tm.team_id = p.team_id
       JOIN deadlines d ON d.id = s.deadline_id
       WHERE tm.student_id = ?
       ORDER BY s.submitted_at DESC`,
      [req.user.id]
    );
    res.json({ submissions: await withFeedback(rows) });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Guide: submissions from my projects
router.get("/assigned", requireRole("guide"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.project_id, p.title AS project_title, t.name AS team_name,
              s.deadline_id, d.title AS deadline_title, s.submitted_at
       FROM submissions s
       JOIN projects p ON p.id = s.project_id
       JOIN teams t ON t.id = p.team_id
       JOIN deadlines d ON d.id = s.deadline_id
       WHERE p.guide_id = ?
       ORDER BY s.submitted_at DESC`,
      [req.user.id]
    );
    res.json({ submissions: await withFeedback(rows) });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Any allowed user: submissions of one project
router.get("/project/:projectId", async (req, res) => {
  try {
    const [pr] = await pool.query("SELECT id, team_id, guide_id FROM projects WHERE id = ?", [
      Number(req.params.projectId),
    ]);
    if (!pr.length) return res.status(404).json({ error: "Project not found" });
    if (!(await canSeeProject(req.user, pr[0]))) {
      return res.status(403).json({ error: "Not allowed" });
    }
    const [rows] = await pool.query(
      `SELECT s.id, s.deadline_id, d.title AS deadline_title, s.submitted_at
       FROM submissions s JOIN deadlines d ON d.id = s.deadline_id
       WHERE s.project_id = ? ORDER BY s.submitted_at DESC`,
      [pr[0].id]
    );
    res.json({ submissions: await withFeedback(rows) });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Download a file (not public: needs login and access to that project)
router.get("/:id/download", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.file_path, p.team_id, p.guide_id
       FROM submissions s JOIN projects p ON p.id = s.project_id
       WHERE s.id = ?`,
      [Number(req.params.id)]
    );
    if (!rows.length) return res.status(404).json({ error: "Submission not found" });
    if (!(await canSeeProject(req.user, rows[0]))) {
      return res.status(403).json({ error: "Not allowed" });
    }
    const full = path.resolve(SERVER_DIR, rows[0].file_path);
    if (!full.startsWith(UPLOAD_DIR) || !fs.existsSync(full)) {
      return res.status(404).json({ error: "File not found on server" });
    }
    res.download(full);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
