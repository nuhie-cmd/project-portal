const bcrypt = require("bcrypt");
const pool = require("../db.js");

async function run() {
  const conn = await pool.getConnection();
  try {
    const hash = await bcrypt.hash("Password@123", 10);

    await conn.query("PRAGMA foreign_keys = OFF");
    for (const t of [
      "notifications", "ai_reviews", "similarity_results", "meetings",
      "milestones", "feedback", "submissions", "deadlines", "projects",
      "team_members", "teams", "users",
    ]) {
      await conn.query(`DELETE FROM ${t}`);
    }
    await conn.query("DELETE FROM sqlite_sequence");
    await conn.query("PRAGMA foreign_keys = ON");

    // users: id 1-2 = coordinators, 3 = guide, 4-11 = students
    const users = [
      [1, "Ms. Sreekshitha", "sreekshitha@college.test", "coordinator", null],
      [2, "Ms. Shweta Naik", "shweta@college.test", "coordinator", null],
      [3, "Ms. Deeksha", "deeksha@college.test", "guide", null],
      [4, "Mirvaza Musthafa", "mirvaza@college.test", "student", "4SF24CI084"],
      [5, "Nuha Fathima", "nuha@college.test", "student", "4SF24CI108"],
      [6, "TB Abhishek", "abhishek@college.test", "student", "4SF24CI173"],
      [7, "Gagana", "gagana@college.test", "student", "4SF24CI055"],
      [8, "Mahek", "mahek@college.test", "student", "4SF24CI079"],
      [9, "Nafiza", "nafiza@college.test", "student", "4SF24CI103"],
      [10, "Anfaz", "anfaz@college.test", "student", "4SF24CI011"],
      [11, "Keerthana", "keerthana@college.test", "student", "4SF24CI056"],
    ];
    for (const [id, name, email, role, usn] of users) {
      await conn.query(
        "INSERT INTO users (id, name, email, password_hash, role, usn) VALUES (?,?,?,?,?,?)",
        [id, name, email, hash, role, usn]
      );
    }

    // teams (leaders are also inserted as members)
    await conn.query(
      "INSERT INTO teams (id, name, leader_id) VALUES (1,'Team Alpha',4),(2,'Team Beta',8)"
    );
    await conn.query(
      "INSERT INTO team_members (team_id, student_id) VALUES (1,4),(1,5),(1,6),(1,7),(2,8),(2,9),(2,10),(2,11)"
    );

    // projects: Team Alpha assigned to Ms. Deeksha (3), Team Beta unassigned
    await conn.query(
      `INSERT INTO projects (id, team_id, guide_id, title, description, objectives, scope, status) VALUES
      (1,1,3,'Smart Student-Faculty Project Coordination and Monitoring System',
       'A web-based application to streamline academic mini-project management with AI similarity detection.',
       'Simplify project registration, guide allocation, milestone tracking and similarity checks.',
       'Department mini-project portal for students, guides and coordinators.','In Progress'),
      (2,2,NULL,'Crop Disease Detection Using Leaf Images',
       'A model that identifies common crop diseases from photos of leaves.',
       'Classify at least 5 diseases; show treatment suggestions.',
       'Image classification using a public dataset; no mobile app.','Pending')`
    );

    // deadlines
    const now = new Date();
    const daysFrom = (d) => {
      const x = new Date(now);
      x.setDate(x.getDate() + d);
      return x.toISOString().slice(0, 19).replace("T", " ");
    };
    const dl = [
      ["Project Proposal", "Submit title, problem statement and objectives", -3],
      ["Review 1 Presentation", "Mid-point progress presentation", 2],
      ["Review 2 Presentation", "Final implementation review", 14],
      ["Final Report", "Submit the final project report", 30],
    ];
    for (const [title, desc, days] of dl) {
      await conn.query(
        "INSERT INTO deadlines (title, description, due_date, created_by) VALUES (?,?,?,1)",
        [title, desc, daysFrom(days)]
      );
    }

    await conn.query(
      "INSERT INTO submissions (project_id, deadline_id, file_path) VALUES (1,1,'uploads/sample_proposal_1.pdf')"
    );
    await conn.query(
      "INSERT INTO feedback (submission_id, guide_id, comments) VALUES (1,3,'Good start. Make the objectives measurable and narrow the scope.')"
    );
    await conn.query(
      "INSERT INTO milestones (project_id, title, status) VALUES (1,'Requirement analysis','Done'),(1,'Database design','In Progress'),(1,'Frontend development','Not Started'),(2,'Requirement analysis','In Progress')"
    );
    await conn.query(
      "INSERT INTO meetings (project_id, scheduled_at, agenda, status) VALUES (1, ?, 'Review database design', 'Scheduled')",
      [daysFrom(3)]
    );
    await conn.query(
      "INSERT INTO notifications (user_id, message) VALUES (4,'Review 1 Presentation is due in 2 days'),(3,'New submission from Team Alpha')"
    );

    console.log("Seed complete. Login password for all accounts: Password@123");
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    conn.release();
    await pool.end();
  }
}

run();
