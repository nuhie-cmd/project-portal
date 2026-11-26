import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { api, downloadSubmission } from "../api";

function GuideDashboard() {
  const [projects, setProjects] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [feedbackText, setFeedbackText] = useState({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadAll = async () => {
    try {
      const [pRes, sRes, mRes] = await Promise.all([
        api("/projects/assigned"),
        api("/submissions/assigned"),
        api("/milestones/assigned"),
      ]);
      setProjects(pRes.projects || []);
      setSubmissions(sRes.submissions || []);
      setMilestones(mRes.milestones || []);
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const updateProjectStatus = async (projectId, status) => {
    setErr("");
    setMsg("");
    try {
      await api(`/projects/${projectId}/status`, {
        method: "PUT",
        body: { status },
      });
      setMsg("Project status updated.");
      loadAll();
    } catch (e) {
      setErr(e.message);
    }
  };

  const submitFeedback = async (submissionId) => {
    const comments = (feedbackText[submissionId] || "").trim();
    if (!comments) return;
    setErr("");
    setMsg("");
    try {
      await api("/feedback", {
        method: "POST",
        body: { submission_id: submissionId, comments },
      });
      setFeedbackText((prev) => ({ ...prev, [submissionId]: "" }));
      setMsg("Feedback saved.");
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

  const pendingReviews = submissions.filter((s) => !s.feedback?.length).length;
  const approvedCount = projects.filter((p) => p.status === "Approved" || p.status === "Completed").length;

  return (
    <DashboardLayout role="Guide">
      <h2>Guide Dashboard</h2>
      {err && <div className="alert alert-warning" style={{ marginBottom: 16 }}>{err}</div>}
      {msg && <div className="alert alert-ok" style={{ marginBottom: 16 }}>{msg}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-number">{projects.length}</div>
          <div className="stat-label">Assigned teams</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{submissions.length}</div>
          <div className="stat-label">Total submissions</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{approvedCount}</div>
          <div className="stat-label">Approved / Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{pendingReviews}</div>
          <div className="stat-label">Feedback pending</div>
        </div>
      </div>

      <h3>Assigned Teams</h3>
      <table className="data-table" style={{ marginBottom: 28 }}>
        <thead>
          <tr>
            <th>Team</th>
            <th>Project</th>
            <th>Status</th>
            <th>Update Status</th>
          </tr>
        </thead>
        <tbody>
          {projects.length === 0 ? (
            <tr><td colSpan="4">No teams assigned yet.</td></tr>
          ) : (
            projects.map((p) => (
              <tr key={p.id}>
                <td>{p.team_name}</td>
                <td>{p.title}</td>
                <td>{p.status}</td>
                <td>
                  <select value={p.status} onChange={(e) => updateProjectStatus(p.id, e.target.value)}>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h3>Submissions &amp; Feedback</h3>
      <table className="data-table" style={{ marginBottom: 28 }}>
        <thead>
          <tr>
            <th>Team</th>
            <th>Deadline</th>
            <th>File</th>
            <th>Existing Feedback</th>
            <th>Add Feedback</th>
          </tr>
        </thead>
        <tbody>
          {submissions.length === 0 ? (
            <tr><td colSpan="5">No submissions yet.</td></tr>
          ) : (
            submissions.map((s) => (
              <tr key={s.id}>
                <td>{s.team_name}</td>
                <td>{s.deadline_title}</td>
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
                <td>
                  {s.feedback?.length
                    ? s.feedback.map((f) => f.comments).join(" | ")
                    : "None"}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Write feedback..."
                      value={feedbackText[s.id] || ""}
                      onChange={(e) => setFeedbackText((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => submitFeedback(s.id)}
                      style={{ padding: "6px 12px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
                    >
                      Send
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h3>Team Milestones</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>Project</th>
            <th>Milestone</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {milestones.length === 0 ? (
            <tr><td colSpan="4">No milestones yet.</td></tr>
          ) : (
            milestones.map((m) => (
              <tr key={m.id}>
                <td>{m.team_name}</td>
                <td>{m.project_title}</td>
                <td>{m.title}</td>
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
    </DashboardLayout>
  );
}

export default GuideDashboard;
