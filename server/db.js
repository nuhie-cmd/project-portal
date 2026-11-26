/**
 * db.js – SQLite wrapper that exposes the same async interface as mysql2/promise.
 *
 * Every route calls:
 *   const [rows] = await pool.query(sql, params)
 *   const [[row]] = await pool.query(sql, params)      // first row only
 *   const conn   = await pool.getConnection()          // for transactions
 *     conn.query / conn.beginTransaction / conn.commit / conn.rollback / conn.release
 *
 * We emulate all of that with better-sqlite3 (synchronous, in-process).
 */

const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "data.sqlite");
const db = new Database(DB_PATH);

// WAL mode – faster writes, still safe
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Schema bootstrap ─────────────────────────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL CHECK(role IN ('student','guide','coordinator')),
  usn             TEXT,
  max_teams       INTEGER NOT NULL DEFAULT 4,
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS teams (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  leader_id   INTEGER NOT NULL REFERENCES users(id),
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id    INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  PRIMARY KEY (team_id, student_id)
);

CREATE TABLE IF NOT EXISTS projects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id     INTEGER NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  guide_id    INTEGER REFERENCES users(id),
  title       TEXT NOT NULL,
  description TEXT,
  objectives  TEXT,
  scope       TEXT,
  status      TEXT NOT NULL DEFAULT 'Pending'
              CHECK(status IN ('Pending','Approved','In Progress','Completed')),
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deadlines (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT,
  due_date    TEXT NOT NULL,
  created_by  INTEGER NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS submissions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  deadline_id  INTEGER NOT NULL REFERENCES deadlines(id),
  file_path    TEXT NOT NULL,
  submitted_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feedback (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  guide_id      INTEGER NOT NULL REFERENCES users(id),
  comments      TEXT NOT NULL,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS milestones (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'Not Started'
             CHECK(status IN ('Not Started','In Progress','Done')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS meetings (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scheduled_at TEXT NOT NULL,
  agenda       TEXT,
  notes        TEXT,
  status       TEXT NOT NULL DEFAULT 'Scheduled'
               CHECK(status IN ('Scheduled','Completed'))
);

CREATE TABLE IF NOT EXISTS previous_projects (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  source_project_id TEXT,
  title             TEXT NOT NULL,
  domain            TEXT,
  project_type      TEXT,
  academic_year     TEXT,
  problem_statement TEXT,
  objectives        TEXT,
  methodology       TEXT,
  technologies      TEXT,
  created_at        TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS similarity_results (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id          INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  previous_project_id INTEGER NOT NULL REFERENCES previous_projects(id) ON DELETE CASCADE,
  score               REAL NOT NULL,
  checked_at          TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_reviews (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  review_text TEXT NOT NULL,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  is_read    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// ── Seed default data if DB is empty ─────────────────────────────────────────
const userCount = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
if (userCount === 0) {
  const bcrypt = require("bcrypt");
  // Synchronous bcrypt not available; use a pre-hashed value for Password@123 (bcrypt,10)
  const HASH = "$2b$10$YourHashHere"; // placeholder – real hash injected below via async IIFE

  // We run this in an async IIFE so we can await bcrypt
  (async () => {
    const hash = await bcrypt.hash("Password@123", 10);
    db.transaction(() => {
      const ins = db.prepare(
        "INSERT INTO users (id,name,email,password_hash,role,usn) VALUES (?,?,?,?,?,?)"
      );
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
      for (const [id,name,email,role,usn] of users)
        ins.run(id,name,email,hash,role,usn);

      db.prepare("INSERT INTO teams (id,name,leader_id) VALUES (1,'Team Alpha',4),(2,'Team Beta',8)").run();
      const tm = db.prepare("INSERT INTO team_members (team_id,student_id) VALUES (?,?)");
      for (const [t,s] of [[1,4],[1,5],[1,6],[1,7],[2,8],[2,9],[2,10],[2,11]]) tm.run(t,s);

      db.prepare(`INSERT INTO projects (id,team_id,guide_id,title,description,objectives,scope,status) VALUES
        (1,1,3,'Smart Student-Faculty Project Coordination and Monitoring System',
         'A web-based application to streamline academic mini-project management with AI similarity detection.',
         'Simplify project registration, guide allocation, milestone tracking and similarity checks.',
         'Department mini-project portal for students, guides and coordinators.','In Progress'),
        (2,2,NULL,'Crop Disease Detection Using Leaf Images',
         'A model that identifies common crop diseases from photos of leaves.',
         'Classify at least 5 diseases; show treatment suggestions.',
         'Image classification using a public dataset; no mobile app.','Pending')`).run();

      const now = new Date();
      const dl = db.prepare("INSERT INTO deadlines (title,description,due_date,created_by) VALUES (?,?,?,1)");
      const daysFrom = d => { const x=new Date(now); x.setDate(x.getDate()+d); return x.toISOString().slice(0,19).replace("T"," "); };
      dl.run("Project Proposal","Submit title, problem statement and objectives", daysFrom(-3));
      dl.run("Review 1 Presentation","Mid-point progress presentation", daysFrom(2));
      dl.run("Review 2 Presentation","Final implementation review", daysFrom(14));
      dl.run("Final Report","Submit the final project report", daysFrom(30));

      db.prepare("INSERT INTO submissions (project_id,deadline_id,file_path) VALUES (1,1,'uploads/sample_proposal_1.pdf')").run();
      db.prepare("INSERT INTO feedback (submission_id,guide_id,comments) VALUES (1,3,'Good start. Make the objectives measurable and narrow the scope.')").run();
      db.prepare("INSERT INTO milestones (project_id,title,status) VALUES (1,'Requirement analysis','Done'),(1,'Database design','In Progress'),(1,'Frontend development','Not Started'),(2,'Requirement analysis','In Progress')").run();

      const meetAt = daysFrom(3);
      db.prepare("INSERT INTO meetings (project_id,scheduled_at,agenda,status) VALUES (1,?,'Review database design','Scheduled')").run(meetAt);
      db.prepare("INSERT INTO notifications (user_id,message) VALUES (4,'Review 1 Presentation is due in 2 days'),(3,'New submission from Team Alpha')").run();
    })();
    console.log("✅ SQLite DB seeded. Login password for all accounts: Password@123");
  })();
}

// Seed previous_projects if empty
const prevCount = db.prepare("SELECT COUNT(*) AS n FROM previous_projects").get().n;
if (prevCount === 0) {
  const insPrev = db.prepare(
    "INSERT INTO previous_projects (source_project_id, title, domain, project_type, academic_year, problem_statement, objectives, methodology, technologies) VALUES (?,?,?,?,?,?,?,?,?)"
  );
  const prevProjects = [
    ["PRJ-2024-01", "Forecasting leftover meals in university cafeterias", "Machine Learning", "Mini Project", "2024-25", "Predict how much food will be left over each day using past data.", "Reduce food waste in campus dining halls.", "Time-series regression on daily meal counts.", "Python, Scikit-learn, Flask"],
    ["PRJ-2024-02", "Attendance using face recognition", "Computer Vision", "Mini Project", "2024-25", "Mark student attendance automatically from classroom camera images.", "Eliminate manual roll-call errors.", "Face detection and embedding matching.", "Python, OpenCV, DeepFace"],
    ["PRJ-2024-03", "Library book recommendation system", "Data Science", "Mini Project", "2024-25", "Recommend books to students based on their borrowing history.", "Increase library engagement using collaborative filtering.", "Cosine similarity on borrowing matrices.", "Python, Pandas, React"],
    ["PRJ-2024-04", "Campus bus tracking app", "IoT & Mobile", "Mini Project", "2024-25", "Show live location of college buses on a map.", "Help students track shuttle arrival times.", "GPS telemetry streamed to a web map.", "Node.js, Leaflet, MQTT"],
  ];
  for (const row of prevProjects) insPrev.run(...row);
}

// ── Pool shim (mysql2-compatible async API) ───────────────────────────────────

/**
 * Run a query and return [rows, undefined] like mysql2.
 * Handles SELECT (array of rows) and DML (object with insertId / affectedRows).
 * Converts ? placeholders to positional ? (better-sqlite3 uses ? natively).
 * Handles IN (?) by expanding arrays in params.
 */
function runQuery(sql, params = []) {
  // Expand any array param into multiple ? (for WHERE id IN (?))
  const flat = [];
  let expanded = sql;
  let pIdx = 0;
  const parts = sql.split("?");
  if (parts.length - 1 !== params.length) {
    // Can't expand; just pass through
    for (const p of params) flat.push(p);
  } else {
    let out = "";
    for (let i = 0; i < parts.length - 1; i++) {
      const p = params[pIdx++];
      if (Array.isArray(p)) {
        out += parts[i] + p.map(() => "?").join(",");
        for (const v of p) flat.push(v);
      } else {
        out += parts[i] + "?";
        flat.push(p);
      }
    }
    out += parts[parts.length - 1];
    expanded = out;
  }

  // Replace MySQL-specific functions with SQLite equivalents
  expanded = expanded
    .replace(/\bCURDATE\(\)/gi, "date('now')")
    .replace(/\bNOW\(\)/gi, "datetime('now')")
    .replace(/DATEDIFF\(([^,]+),\s*([^)]+)\)/gi,
      "CAST((julianday($1) - julianday($2)) AS INTEGER)")
    .replace(/DATE_ADD\(([^,]+),\s*INTERVAL\s+(\d+)\s+DAY\)/gi,
      "date($1, '+$2 days')")
    .replace(/DATE_FORMAT\([^,]+,\s*'[^']+'\)/gi, (m) => {
      // very rough – just extract the column name
      const col = m.match(/DATE_FORMAT\(([^,]+),/)?.[1]?.trim() || "''";
      return col;
    })
    .replace(/\bFOR UPDATE\b/gi, "")          // SQLite has no row-level locks
    .replace(/\bAUTO_INCREMENT\b/gi, "")
    .replace(/`/g, '"');                       // backtick → double-quote identifiers

  const trimmed = expanded.trim().toUpperCase();
  const isSelect =
    trimmed.startsWith("SELECT") ||
    trimmed.startsWith("WITH") ||
    (trimmed.startsWith("PRAGMA") && !trimmed.includes("="));

  if (isSelect) {
    const rows = db.prepare(expanded).all(...flat);
    return [rows, undefined];
  } else {
    const info = db.prepare(expanded).run(...flat);
    return [{ insertId: info.lastInsertRowid, affectedRows: info.changes }, undefined];
  }
}

// Connection shim (supports beginTransaction / commit / rollback)
function makeConn() {
  return {
    _tx: null,
    query(sql, params) { return Promise.resolve(runQuery(sql, params)); },
    beginTransaction() {
      db.prepare("BEGIN").run();
      return Promise.resolve();
    },
    commit() {
      db.prepare("COMMIT").run();
      return Promise.resolve();
    },
    rollback() {
      try { db.prepare("ROLLBACK").run(); } catch {}
      return Promise.resolve();
    },
    release() {},
  };
}

const pool = {
  query(sql, params) { return Promise.resolve(runQuery(sql, params)); },
  async getConnection() { return makeConn(); },
  async end() {},
};

module.exports = pool;
