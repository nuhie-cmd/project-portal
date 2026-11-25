const express = require("express");
const pool = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// Accepts "2026-12-01", "2026-12-01T17:00" or "2026-12-01 17:00:00"
// and returns "YYYY-MM-DD HH:MM:SS" for MySQL, or null if invalid.
function toMysqlDate(value) {
  if (!value) return null;
  const s = String(value).trim().replace("T", " ").replace(/Z$/, "").replace(/\.\d+$/, "");
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!m) return null;
  const [, y, mo, d, h = "23", mi = "59", sec = "00"] = m;
  if (isNaN(new Date(`${y}-${mo}-${d}T${h}:${mi}:${sec}`).getTime())) return null;
  return `${y}-${mo}-${d} ${h}:${mi}:${sec}`;
}

// Everyone: list deadlines with a computed state
router.get("/", async (req, res) => {
  try {
    let projectId = null;
    if (req.user.role === "student") {
      const [p] = await pool.query(
        `SELECT p.id FROM projects p
         JOIN team_members tm ON tm.team_id = p.team_id
         WHERE tm.student_id = ?`,
        [req.user.id]
      );
      projectId = p[0] ? p[0].id : null;
    }

    const [rows] = await pool.query(
      `SELECT d.id, d.title, d.description, d.due_date, d.created_by,
              DATEDIFF(d.due_date, NOW()) AS days_left,
              CASE
                WHEN d.due_date < NOW() THEN 'overdue'
                WHEN d.due_date < DATE_ADD(NOW(), INTERVAL 3 DAY) THEN 'due_soon'
                ELSE 'upcoming'
              END AS state,
              EXISTS(SELECT 1 FROM submissions s
                     WHERE s.deadline_id = d.id AND s.project_id = ?) AS submitted
       FROM deadlines d
       ORDER BY d.due_date ASC`,
      [projectId]
    );
    res.json({ deadlines: rows });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Coordinator creates a deadline
router.post("/", requireRole("coordinator"), async (req, res) => {
  const { title, description, due_date } = req.body;
  if (!title || !due_date) {
    return res.status(400).json({ error: "Title and due_date are required" });
  }
  const due = toMysqlDate(due_date);
  if (!due) {
    return res.status(400).json({ error: "due_date must look like 2026-12-01 or 2026-12-01 17:00" });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO deadlines (title, description, due_date, created_by) VALUES (?,?,?,?)",
      [title.trim(), description || null, due, req.user.id]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Coordinator edits a deadline
router.put("/:id", requireRole("coordinator"), async (req, res) => {
  const id = Number(req.params.id);
  const { title, description, due_date } = req.body;
  if (!title || !due_date) {
    return res.status(400).json({ error: "Title and due_date are required" });
  }
  const due = toMysqlDate(due_date);
  if (!due) return res.status(400).json({ error: "Invalid due_date" });
  try {
    const [result] = await pool.query(
      "UPDATE deadlines SET title = ?, description = ?, due_date = ? WHERE id = ?",
      [title.trim(), description || null, due, id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Deadline not found" });
    res.json({ message: "Deadline updated" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Coordinator deletes a deadline (blocked if submissions exist)
router.delete("/:id", requireRole("coordinator"), async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM deadlines WHERE id = ?", [Number(req.params.id)]);
    if (!result.affectedRows) return res.status(404).json({ error: "Deadline not found" });
    res.json({ message: "Deadline deleted" });
  } catch (err) {
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({ error: "Submissions already exist for this deadline" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;