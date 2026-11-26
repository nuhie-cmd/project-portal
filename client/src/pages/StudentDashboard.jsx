import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { api, apiForm, downloadSubmission, getUser } from "../api";

function StudentDashboard() {
  const user = getUser();
  const [team, setTeam] = useState(null);
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [teamName, setTeamName] = useState("");
  const [memberUsn, setMemberUsn] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [deadlineId, setDeadlineId] = useState("");
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadAll = async () => {
    try {
      const [tRes, pRes, mRes, sRes, dRes, mtRes, nRes] = await Promise.all([
        api("/teams/mine"),
        api("/projects/mine"),
        api("/milestones/mine"),
        api("/submissions/mine"),
        api("/deadlines"),
        api("/meetings/mine"),
        api("/notifications"),
      ]);
      setTeam(tRes.team);
      setProject(pRes.project);
      setMilestones(mRes.milestones || []);
      setSubmissions(sRes.submissions || []);
      setDeadlines(dRes.deadlines || []);
      setMeetings(mtRes.meetings || []);
      setNotifications(nRes.notifications || []);
      if (dRes.deadlines?.length && !deadlineId) {
        setDeadlineId(String(dRes.deadlines[0].id));
      }
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const createTeam = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api("/teams", { method: "POST", body: { name: teamName } });
      setTeamName("");
      setMsg("Team created!");
      loadAll();
    } catch (e) {
      setErr(e.message);
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      const res = await api(`/teams/${team.id}/members`, {
        method: "POST",
        body: { usn: memberUsn },
      });
      setMemberUsn("");
      setMsg(res.message);
      loadAll();
    } catch (e) {
      setErr(e.message);
    }
  };

  const addMilestone = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api("/milestones", { method: "POST", body: { title: milestoneTitle } });
      setMilestoneTitle("");
      loadAll();
    } catch (e) {
      setErr(e.message);
    }
  };

  const updateMilestone = async (id, status) => {
    setErr("");
    try {
      await api(`/milestones/${id}`, { method: "PUT", body: { status } });
      loadAll();
    } catch (e) {
      setErr(e.message);
    }
  };

  const uploadSubmission = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!file || !deadlineId) return setErr("Select a deadline and a file");
    const fd = new FormData();
    fd.append("deadline_id", deadlineId);
    fd.append("file", file);
    try {
      await apiForm("/submissions", fd);
      setFile(null);
      e.target.reset();
      setMsg("File submitted!");
      loadAll();
    } catch (e) {
      setErr(e.message);
    }
  };

  const markAllRead = async () => {
    await api("/notifications/read-all", { method: "PUT" });
    loadAll();
  };

  const nextDeadline = deadlines.find((d) => d.state !== "overdue") || deadlines[0];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <DashboardLayout role="Student">
      <h2>Student Dashboard</h2>
      {err && <div className="alert alert-warning" style={{ marginBottom: 16 }}>{err}</div>}
      {msg && <div className="alert alert-ok" style={{ marginBottom: 16 }}>{msg}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-number">{team ? team.name : "No Team"}</div>
          <div className="stat-label">Team status</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{project?.guide_name || "Unassigned"}</div>
          <div className="stat-label">Assigned guide</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{project?.status || "Not Registered"}</div>
          <div className="stat-label">Project status</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{nextDeadline ? nextDeadline.due_date.slice(0, 10) : "None"}</div>
          <div className="stat-label">Next deadline</div>
        </div>
      </div>

      <div className="project-card">
        <h3>My Team</h3>
        {team ? (
          <>
            <p><strong>{team.name}</strong> ({team.members.length}/4 members)</p>
            <p>Members: {team.members.map((m) => `${m.name} (${m.usn || ""})`).join(", ")}</p>
            {user?.id === team.leader_id && team.members.length < 4 && (
              <form className="inline-form" style={{ marginTop: 12, marginBottom: 0 }} onSubmit={addMember}>
                <input
                  type="text"
                  placeholder="Add member by USN (e.g. 4SF24CI009)"
                  value={memberUsn}
                  onChange={(e) => setMemberUsn(e.target.value)}
                  required
                />
                <button type="submit">Add Member</button>
              </form>
            )}
          </>
        ) : (
          <form className="inline-form" style={{ marginBottom: 0 }} onSubmit={createTeam}>
            <input
              type="text"
              placeholder="New team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />
            <button type="submit">Create Team</button>
          </form>
        )}
      </div>

      <div className="project-card">
        <h3>Your Project</h3>
        {project ? (
          <>
            <span className={project.status === "Approved" || project.status === "Completed" ? "status-badge" : "status-badge waiting"}>
              {project.status}
            </span>
            <p style={{ marginTop: 8 }}><strong>{project.title}</strong></p>
            <p>{project.description}</p>
            {project.objectives && <p><strong>Objectives:</strong> {project.objectives}</p>}
            {project.scope && <p><strong>Scope:</strong> {project.scope}</p>}
            <p><strong>Guide:</strong> {project.guide_name || "Pending allocation"}</p>
          </>
        ) : (
          <p>
            No project registered yet.{" "}
            <Link to="/proposal" style={{ color: "#4f46e5", fontWeight: 600 }}>
              Submit a proposal &amp; check similarity
            </Link>
          </p>
        )}
      </div>

      <h3>Milestones</h3>
      {project && (
        <form className="inline-form" onSubmit={addMilestone}>
          <input
            type="text"
            placeholder="New milestone title"
            value={milestoneTitle}
            onChange={(e) => setMilestoneTitle(e.target.value)}
            required
          />
          <button type="submit">Add Milestone</button>
        </form>
      )}
      <table className="data-table" style={{ marginBottom: 28 }}>
        <thead>
          <tr>
            <th>Milestone</th>
            <th>Status</th>
            <th>Update</th>
          </tr>
        </thead>
        <tbody>
          {milestones.length === 0 ? (
            <tr><td colSpan="3">No milestones yet.</td></tr>
          ) : (
            milestones.map((m) => (
              <tr key={m.id}>
                <td>{m.title}</td>
                <td>{m.status}</td>
                <td>
                  <select value={m.status} onChange={(e) => updateMilestone(m.id, e.target.value)}>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h3>Submissions &amp; Feedback</h3>
      {project && (
        <form className="inline-form" onSubmit={uploadSubmission}>
          <select value={deadlineId} onChange={(e) => setDeadlineId(e.target.value)}>
            {deadlines.map((d) => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
          <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip" onChange={(e) => setFile(e.target.files[0])} required />
          <button type="submit">Upload Submission</button>
        </form>
      )}
      <table className="data-table" style={{ marginBottom: 28 }}>
        <thead>
          <tr>
            <th>Deadline</th>
            <th>Submitted At</th>
            <th>Guide Feedback</th>
            <th>File</th>
          </tr>
        </thead>
        <tbody>
          {submissions.length === 0 ? (
            <tr><td colSpan="4">No submissions yet.</td></tr>
          ) : (
            submissions.map((s) => (
              <tr key={s.id}>
                <td>{s.deadline_title}</td>
                <td>{s.submitted_at?.slice(0, 16)}</td>
                <td>
                  {s.feedback?.length
                    ? s.feedback.map((f) => `${f.guide_name}: ${f.comments}`).join(" | ")
                    : "Pending review"}
                </td>
                <td>
                  <button
                    type="button"
                    className="link-button"
                    style={{ color: "#4f46e5" }}
                    onClick={() => downloadSubmission(s.id, `submission-${s.id}.pdf`).catch((e) => setErr(e.message))}
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h3>Upcoming Meetings</h3>
      <table className="data-table" style={{ marginBottom: 28 }}>
        <thead>
          <tr>
            <th>Date &amp; Time</th>
            <th>Agenda</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {meetings.length === 0 ? (
            <tr><td colSpan="4">No meetings scheduled.</td></tr>
          ) : (
            meetings.map((m) => (
              <tr key={m.id}>
                <td>{m.scheduled_at}</td>
                <td>{m.agenda || "-"}</td>
                <td>{m.status}</td>
                <td>{m.notes || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <h3>Notifications ({unreadCount} unread)</h3>
        {unreadCount > 0 && (
          <button type="button" className="link-button" style={{ color: "#4f46e5" }} onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Message</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {notifications.length === 0 ? (
            <tr><td colSpan="2">No notifications.</td></tr>
          ) : (
            notifications.map((n) => (
              <tr key={n.id}>
                <td>{n.message}</td>
                <td>{n.is_read ? "Read" : "Unread"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </DashboardLayout>
  );
}

export default StudentDashboard;
