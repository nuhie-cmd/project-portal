const pool = require("./db");

const REMINDER_DAYS = 3;

async function runReminders() {
  try {
    // Get all deadlines due within REMINDER_DAYS
    const [deadlines] = await pool.query(
      `SELECT id, title, due_date FROM deadlines
       WHERE CAST((julianday(due_date) - julianday(date('now'))) AS INTEGER) BETWEEN 0 AND ?`,
      [REMINDER_DAYS]
    );

    let count = 0;
    for (const d of deadlines) {
      // Find students who haven't submitted yet
      const [students] = await pool.query(
        `SELECT tm.student_id AS user_id FROM team_members tm
         JOIN projects p ON p.team_id = tm.team_id
         WHERE NOT EXISTS (
           SELECT 1 FROM submissions s
           WHERE s.project_id = p.id AND s.deadline_id = ?
         )`,
        [d.id]
      );

      for (const s of students) {
        const msg = `Reminder: "${d.title}" is due on ${d.due_date.slice(0, 10)}`;
        // Don't duplicate
        const [existing] = await pool.query(
          "SELECT id FROM notifications WHERE user_id = ? AND message = ?",
          [s.user_id, msg]
        );
        if (!existing.length) {
          await pool.query(
            "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
            [s.user_id, msg]
          );
          count++;
        }
      }
    }
    return count;
  } catch (e) {
    console.error("Reminder error:", e.message);
    return 0;
  }
}

module.exports = { runReminders };
