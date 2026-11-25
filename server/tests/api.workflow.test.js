const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

/**
 * In-memory relational store simulating the MySQL `project_portal` schema
 * so the Express routes, bcrypt hashing, JWT auth, RBAC, and workflow logic
 * can be verified end-to-end even when live MySQL credentials are unavailable.
 */
function createMockPool() {
  const store = {
    users: [],
    teams: [],
    team_members: [],
    project_proposals: [],
    project_status: [],
    guide_reviews: [],
  };
  let seq = 1;
  const nextId = () => seq++;

  async function query(sql, params = []) {
    const s = sql.replace(/\s+/g, " ").trim();

    if (s.startsWith("SELECT COUNT(*) AS users FROM users")) {
      return [[{ users: store.users.length }]];
    }

    if (s.startsWith("SELECT id FROM users WHERE email = ?")) {
      const rows = store.users.filter((u) => u.email === params[0]);
      return [rows.map((u) => ({ id: u.id }))];
    }

    if (s.startsWith("INSERT INTO users")) {
      const id = nextId();
      store.users.push({
        id,
        name: params[0],
        email: params[1],
        password_hash: params[2],
        role: params[3],
        usn: params[4],
        created_at: new Date(),
      });
      return [{ insertId: id }];
    }

    if (s.startsWith("SELECT id, name, email, password_hash, role, usn FROM users WHERE email = ?")) {
      return [store.users.filter((u) => u.email === params[0])];
    }

    if (s.startsWith("SELECT id, name, email FROM users WHERE role = 'guide'")) {
      return [
        store.users
          .filter((u) => u.role === "guide")
          .map(({ id, name, email }) => ({ id, name, email })),
      ];
    }

    if (s.startsWith("SELECT id FROM users WHERE id = ? AND role = 'guide'")) {
      return [store.users.filter((u) => u.id === params[0] && u.role === "guide")];
    }

    if (s.startsWith("SELECT t.*, g.name AS guide_name")) {
      const [uid, e1, e2] = params;
      const matches = store.teams.filter(
        (t) =>
          t.leader_user_id === uid ||
          t.leader_email.toLowerCase() === String(e1).toLowerCase() ||
          store.team_members.some(
            (m) => m.team_id === t.id && m.member_email.toLowerCase() === String(e2).toLowerCase()
          )
      );
      if (matches.length === 0) return [[]];
      const latest = matches[matches.length - 1];
      const guide = store.users.find((u) => u.id === latest.guide_id);
      return [[{ ...latest, guide_name: guide?.name || null, guide_email: guide?.email || null }]];
    }

    if (s.startsWith("SELECT id, team_id, member_name")) {
      return [store.team_members.filter((m) => m.team_id === params[0])];
    }

    if (s.startsWith("INSERT INTO teams")) {
      const id = nextId();
      store.teams.push({
        id,
        team_name: params[0],
        project_title: params[1],
        leader_user_id: params[2],
        leader_name: params[3],
        leader_usn: params[4],
        leader_email: params[5],
        guide_id: params[6],
        created_at: new Date(),
      });
      return [{ insertId: id }];
    }

    if (s.startsWith("INSERT INTO team_members")) {
      const id = nextId();
      const roleInTeam = s.includes("'leader'") ? "leader" : "member";
      store.team_members.push({
        id,
        team_id: params[0],
        member_name: params[1],
        member_usn: params[2],
        member_email: params[3],
        role_in_team: roleInTeam,
        created_at: new Date(),
      });
      return [{ insertId: id }];
    }

    if (s.startsWith("SELECT status FROM project_status WHERE team_id = ?")) {
      return [store.project_status.filter((ps) => ps.team_id === params[0])];
    }

    if (s.startsWith("INSERT INTO project_proposals")) {
      const id = nextId();
      store.project_proposals.push({
        id,
        team_id: params[0],
        submitted_by: params[1],
        title: params[2],
        problem_statement: params[3],
        objectives: params[4],
        technologies_used: params[5],
        description: params[6],
        submitted_at: new Date(),
      });
      return [{ insertId: id }];
    }

    if (s.startsWith("INSERT INTO project_status")) {
      const isPending = s.includes("'Pending'");
      const proposalId = params[0];
      const teamId = params[1];
      const status = isPending ? "Pending" : params[2];
      const remarks = isPending ? null : params[3];
      const updatedBy = isPending ? params[2] : params[4];

      const existing = store.project_status.find((ps) => ps.team_id === teamId);
      if (existing) {
        existing.proposal_id = proposalId;
        existing.status = status;
        existing.remarks = remarks;
        existing.updated_by = updatedBy;
        existing.updated_at = new Date();
      } else {
        store.project_status.push({
          id: nextId(),
          proposal_id: proposalId,
          team_id: teamId,
          status,
          remarks,
          updated_by: updatedBy,
          updated_at: new Date(),
        });
      }
      return [{ affectedRows: 1 }];
    }

    if (s.startsWith("UPDATE teams SET project_title = ? WHERE id = ?")) {
      const t = store.teams.find((x) => x.id === params[1]);
      if (t) t.project_title = params[0];
      return [{ affectedRows: 1 }];
    }

    if (s.startsWith("UPDATE teams SET guide_id = ? WHERE id = ?")) {
      const t = store.teams.find((x) => x.id === params[1]);
      if (t) t.guide_id = params[0];
      return [{ affectedRows: 1 }];
    }

    if (s.startsWith("SELECT * FROM project_proposals WHERE id = ?")) {
      return [store.project_proposals.filter((p) => p.id === params[0])];
    }

    if (s.startsWith("SELECT p.*, ps.status AS current_status")) {
      const proposals = store.project_proposals.filter((p) => p.team_id === params[0]);
      if (proposals.length === 0) return [[]];
      const p = proposals[proposals.length - 1];
      const ps = store.project_status.find((x) => x.proposal_id === p.id);
      return [
        [
          {
            ...p,
            current_status: ps?.status || "Pending",
            remarks: ps?.remarks || null,
            status_updated_at: ps?.updated_at || null,
          },
        ],
      ];
    }

    if (s.startsWith("SELECT gr.*, u.name AS guide_name")) {
      const rows = store.guide_reviews
        .filter((gr) => gr.proposal_id === params[0])
        .map((gr) => {
          const g = store.users.find((u) => u.id === gr.guide_id);
          return { ...gr, guide_name: g?.name || "", guide_email: g?.email || "" };
        })
        .reverse();
      return [rows];
    }

    if (s.startsWith("SELECT t.id, t.team_name, t.project_title")) {
      const guideIdFilter = params.length > 0 ? params[0] : null;
      const rows = store.teams
        .filter((t) => guideIdFilter === null || t.guide_id === guideIdFilter || t.guide_id === null)
        .map((t) => {
          const g = store.users.find((u) => u.id === t.guide_id);
          const ps = store.project_status.find((x) => x.team_id === t.id);
          const p = ps ? store.project_proposals.find((x) => x.id === ps.proposal_id) : null;
          return {
            ...t,
            guide_name: g?.name || null,
            member_count: store.team_members.filter((m) => m.team_id === t.id).length,
            proposal_id: p?.id || null,
            proposal_title: p?.title || null,
            submitted_at: p?.submitted_at || null,
            status: ps?.status || "Not Submitted",
          };
        });
      return [rows];
    }

    if (s.startsWith("SELECT p.*, t.team_name, t.project_title, t.leader_name, t.leader_usn, t.leader_email, t.guide_id, COALESCE(ps.status")) {
      const guideIdFilter = params.length > 0 ? params[0] : null;
      const rows = store.project_proposals
        .map((p) => {
          const t = store.teams.find((x) => x.id === p.team_id);
          const ps = store.project_status.find((x) => x.proposal_id === p.id);
          return {
            ...p,
            team_name: t.team_name,
            project_title: t.project_title,
            leader_name: t.leader_name,
            leader_usn: t.leader_usn,
            leader_email: t.leader_email,
            guide_id: t.guide_id,
            status: ps?.status || "Pending",
            latest_feedback: ps?.remarks || null,
          };
        })
        .filter((row) => guideIdFilter === null || row.guide_id === guideIdFilter || row.guide_id === null);
      return [rows];
    }

    if (s.startsWith("SELECT p.*, t.team_name, t.project_title, t.leader_name, t.leader_usn, t.leader_email, t.guide_id, g.name AS guide_name")) {
      const p = store.project_proposals.find((x) => x.id === params[0]);
      if (!p) return [[]];
      const t = store.teams.find((x) => x.id === p.team_id);
      const g = store.users.find((u) => u.id === t.guide_id);
      const ps = store.project_status.find((x) => x.proposal_id === p.id);
      return [
        [
          {
            ...p,
            team_name: t.team_name,
            project_title: t.project_title,
            leader_name: t.leader_name,
            leader_usn: t.leader_usn,
            leader_email: t.leader_email,
            guide_id: t.guide_id,
            guide_name: g?.name || null,
            status: ps?.status || "Pending",
            latest_feedback: ps?.remarks || null,
          },
        ],
      ];
    }

    if (s.startsWith("SELECT id, member_name, member_usn")) {
      return [store.team_members.filter((m) => m.team_id === params[0])];
    }

    if (s.startsWith("SELECT p.id, p.team_id, t.guide_id FROM project_proposals p")) {
      const p = store.project_proposals.find((x) => x.id === params[0]);
      if (!p) return [[]];
      const t = store.teams.find((x) => x.id === p.team_id);
      return [[{ id: p.id, team_id: p.team_id, guide_id: t.guide_id }]];
    }

    if (s.startsWith("INSERT INTO guide_reviews")) {
      const id = nextId();
      store.guide_reviews.push({
        id,
        proposal_id: params[0],
        guide_id: params[1],
        decision: params[2],
        feedback: params[3],
        reviewed_at: new Date(),
      });
      return [{ insertId: id }];
    }

    throw new Error(`Unhandled mock SQL query: ${s}`);
  }

  return {
    query,
    async getConnection() {
      return {
        query,
        async beginTransaction() {},
        async commit() {},
        async rollback() {},
        release() {},
      };
    },
  };
}

// Replace ../db in require cache before importing app
const dbPath = require.resolve("../db");
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: createMockPool(),
};

const app = require("../index");

async function request(server, method, path, body, token) {
  const port = server.address().port;
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

test("Complete Student -> Team -> Proposal -> Guide Review -> Student Status workflow", async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    // 1. Student registers an account
    const regStudent = await request(server, "POST", "/api/auth/register", {
      name: "Gagan Student",
      email: "gagan@college.edu",
      password: "password123",
      role: "student",
      usn: "1MS23CS001",
    });
    assert.equal(regStudent.status, 201);
    assert.equal(regStudent.data.user.role, "student");

    // Guide registers an account
    const regGuide = await request(server, "POST", "/api/auth/register", {
      name: "Dr. Rao Guide",
      email: "rao@college.edu",
      password: "password123",
      role: "guide",
    });
    assert.equal(regGuide.status, 201);

    // 2. Student logs in
    const loginStudent = await request(server, "POST", "/api/auth/login", {
      email: "gagan@college.edu",
      password: "password123",
    });
    assert.equal(loginStudent.status, 200);
    const studentToken = loginStudent.data.token;
    assert.ok(studentToken);

    // Verify student cannot access guide-only routes (RBAC)
    const forbiddenGuideTeams = await request(
      server,
      "GET",
      "/api/guide/teams",
      null,
      studentToken
    );
    assert.equal(forbiddenGuideTeams.status, 403);

    // 3. Student registers a team
    const teamRes = await request(
      server,
      "POST",
      "/api/teams",
      {
        teamName: "AI Innovators",
        projectTitle: "Smart Campus Portal",
        leader: {
          name: "Gagan Student",
          usn: "1MS23CS001",
          email: "gagan@college.edu",
        },
        members: [
          { name: "Ananya", usn: "1MS23CS002", email: "ananya@college.edu" },
        ],
      },
      studentToken
    );
    assert.equal(teamRes.status, 201);
    assert.equal(teamRes.data.team.members.length, 2);

    // 4. Student submits a project proposal
    const propRes = await request(
      server,
      "POST",
      "/api/proposals",
      {
        title: "Smart Campus Portal",
        problemStatement: "Manual project tracking is slow.",
        objectives: "Digitize team registration and guide reviews.",
        technologiesUsed: "React, Express, MySQL",
        description: "Full-stack portal for mini project approvals.",
      },
      studentToken
    );
    assert.equal(propRes.status, 201);
    assert.equal(propRes.data.status, "Pending");
    const proposalId = propRes.data.proposal.id;

    // 6. Guide logs in
    const loginGuide = await request(server, "POST", "/api/auth/login", {
      email: "rao@college.edu",
      password: "password123",
    });
    assert.equal(loginGuide.status, 200);
    const guideToken = loginGuide.data.token;

    // 7. Guide views the registered team
    const guideTeams = await request(
      server,
      "GET",
      "/api/guide/teams",
      null,
      guideToken
    );
    assert.equal(guideTeams.status, 200);
    assert.equal(guideTeams.data.teams.length, 1);
    assert.equal(guideTeams.data.teams[0].team_name, "AI Innovators");
    assert.equal(guideTeams.data.teams[0].status, "Pending");

    // 8. Guide opens the submitted proposal
    const guideProp = await request(
      server,
      "GET",
      `/api/guide/proposals/${proposalId}`,
      null,
      guideToken
    );
    assert.equal(guideProp.status, 200);
    assert.equal(guideProp.data.proposal.title, "Smart Campus Portal");
    assert.equal(guideProp.data.members.length, 2);

    // Student cannot approve/reject proposals (RBAC)
    const studentReviewAttempt = await request(
      server,
      "POST",
      `/api/guide/proposals/${proposalId}/review`,
      { decision: "Approved", feedback: "Self approve" },
      studentToken
    );
    assert.equal(studentReviewAttempt.status, 403);

    // 9 & 10. Guide adds feedback and approves the proposal
    const reviewRes = await request(
      server,
      "POST",
      `/api/guide/proposals/${proposalId}/review`,
      {
        decision: "Approved",
        feedback: "Well-structured problem statement and feasible scope.",
      },
      guideToken
    );
    assert.equal(reviewRes.status, 200);
    assert.equal(reviewRes.data.status, "Approved");

    // 11. Student sees the updated status and feedback
    const studentStatus = await request(
      server,
      "GET",
      "/api/proposals/my",
      null,
      studentToken
    );
    assert.equal(studentStatus.status, 200);
    assert.equal(studentStatus.data.status, "Approved");
    assert.equal(
      studentStatus.data.latestReview.feedback,
      "Well-structured problem statement and feasible scope."
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
