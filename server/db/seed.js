const bcrypt = require("bcrypt");
const pool = require("../db.js");

async function run() {
  const conn = await pool.getConnection();
  try {
    const hash = await bcrypt.hash("Password@123", 10);

    // wipe everything (local dev only!)
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const t of [
      "notifications", "ai_reviews", "similarity_results", "meetings",
      "milestones", "feedback", "submissions", "deadlines", "projects",
      "team_members", "teams", "users",
    ]) {
      await conn.query(`TRUNCATE TABLE ${t}`);
    }
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");

    // users: id 1 = coordinator, 2-4 = guides, 5-14 = students
    const users = [
      [1, "Dr. Ramesh Iyer", "coord@college.test", "coordinator", null],
      [2, "Dr. Suresh Kumar", "guide1@college.test", "guide", null],
      [3, "Ms. Anitha Rao", "guide2@college.test", "guide", null],
      [4, "Mr. Prakash Nayak", "guide3@college.test", "guide", null],
      [5, "Aarav Shetty", "student1@college.test", "student", "4SF24CI001"],
      [6, "Diya Rao", "student2@college.test", "student", "4SF24CI002"],
      [7, "Rahul Naik", "student3@college.test", "student", "4SF24CI003"],
      [8, "Sneha Pai", "student4@college.test", "student", "4SF24CI004"],
      [9, "Karthik Bhat", "student5@college.test", "student", "4SF24CI005"],
      [10, "Meera Kamath", "student6@college.test", "student", "4SF24CI006"],
      [11, "Varun Hegde", "student7@college.test", "student", "4SF24CI007"],
      [12, "Ananya Shenoy", "student8@college.test", "student", "4SF24CI008"],
      [13, "Rohan D'Souza", "student9@college.test", "student", "4SF24CI009"],
      [14, "Fatima Khan", "student10@college.test", "student", "4SF24CI010"],
    ];
    for (const [id, name, email, role, usn] of users) {
      await conn.query(
        "INSERT INTO users (id, name, email, password_hash, role, usn) VALUES (?,?,?,?,?,?)",
        [id, name, email, hash, role, usn]
      );
    }

    // teams (leaders are also inserted as members)
    await conn.query(
      "INSERT INTO teams (id, name, leader_id) VALUES (1,'Team Alpha',5),(2,'Team Beta',8),(3,'Team Gamma',11)"
    );
    await conn.query(
      "INSERT INTO team_members (team_id, student_id) VALUES (1,5),(1,6),(1,7),(2,8),(2,9),(2,10),(3,11),(3,12)"
    );

    // projects: team 3 has no guide yet
    await conn.query(
      `INSERT INTO projects (id, team_id, guide_id, title, description, objectives, scope, status) VALUES
      (1,1,2,'Online Library Management System',
       'A web application to manage book catalogues, issuing and returning of books by students.',
       'Digitise book issue/return; track fines; search the catalogue.',
       'Web app for one college library; no payment integration.','In Progress'),
      (2,2,2,'Web-Based Book Borrowing Portal',
       'A portal where students can search for books, borrow them and return them online.',
       'Let students reserve books; notify on due dates; manage returns.',
       'Single campus library; browser only.','Approved'),
      (3,3,NULL,'Crop Disease Detection Using Leaf Images',
       'A model that identifies common crop diseases from photos of leaves.',
       'Classify at least 5 diseases; show treatment suggestions.',
       'Image classification using a public dataset; no mobile app.','Pending')`
    );

    // deadlines: -3 days (overdue), +2 (soon), +14, +30
    const dl = [
      ["Project Proposal", "Submit title, problem statement and objectives", -3],
      ["Review 1 Presentation", "Mid-point progress presentation", 2],
      ["Review 2 Presentation", "Final implementation review", 14],
      ["Final Report", "Submit the final project report", 30],
    ];
    for (const [title, desc, days] of dl) {
      await conn.query(
        "INSERT INTO deadlines (title, description, due_date, created_by) VALUES (?,?,DATE_ADD(NOW(), INTERVAL ? DAY),1)",
        [title, desc, days]
      );
    }

    await conn.query(
      "INSERT INTO submissions (project_id, deadline_id, file_path) VALUES (1,1,'uploads/sample_proposal_1.pdf'),(2,1,'uploads/sample_proposal_2.pdf')"
    );
    await conn.query(
      "INSERT INTO feedback (submission_id, guide_id, comments) VALUES (1,2,'Good start. Make the objectives measurable and narrow the scope.')"
    );
    await conn.query(
      "INSERT INTO milestones (project_id, title, status) VALUES (1,'Requirement analysis','Done'),(1,'Database design','In Progress'),(1,'Frontend development','Not Started'),(2,'Requirement analysis','In Progress')"
    );
    await conn.query(
      "INSERT INTO meetings (project_id, scheduled_at, agenda, status) VALUES (1, DATE_ADD(NOW(), INTERVAL 3 DAY), 'Review database design', 'Scheduled')"
    );
    await conn.query(
      "INSERT INTO notifications (user_id, message) VALUES (5,'Review 1 Presentation is due in 2 days'),(2,'New submission from Team Alpha')"
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