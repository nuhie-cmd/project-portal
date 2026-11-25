const pool = require("../db");

const REMINDER_DAYS = 3; // remind when a deadline is this many days away or fewer

async function runReminders() {
  try {
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, message)
       SELECT r.user_id, r.message FROM (
         SELECT tm.student_id AS user_id,
                CONCAT('Reminder: "', d.title, '" is due on ', DATE_FORMAT(d.due_date, '%Y-%m-%d')) AS message
         FROM deadlines d
         CROSS JOIN projects p
         JOIN team_members tm ON tm.team_id = p.team_id
         LEFT JOIN submissions s ON s.project_id = p.id AND s.deadline_id = d.id
         WHERE s.id IS NULL
           AND DATEDIFF(d.due_date, CURDATE()) BETWEEN 0 AND ?
       ) r
       WHERE NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.user_id = r.user_id AND n.message = r.message
       )`,
      [REMINDER_DAYS]
    );
    return result.affectedRows;
  } catch (e) {
    console.error("Reminder error:", e.message);
    return 0;
  }
}

module.exports = { runReminders };