import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "../api";

function CoordinatorDashboard() {
  const [summary, setSummary] = useState(null);
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [gName, setGName] = useState("");
  const [gEmail, setGEmail] = useState("");
  const [gPassword, setGPassword] = useState("");
  const [resetId, setResetId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadAll = async () => {
    try {
      const [sRes, pRes, uRes] = await Promise.all([
        api("/reports/summary"),
        api("/reports/pending-submissions"),
        api("/users"),
      ]);
      setSummary(sRes);
      setPending(pRes.deadlines || []);
      setUsers(uRes.users || []);
      if (uRes.users?.length && !resetId) {
        setResetId(String(uRes.users[0].id));
      }
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const sendReminders = async () => {
    setErr("");
    setMsg("");
    try {
      const res = await api("/reports/send-reminders", { method: "POST" });
      setMsg(res.message);
    } catch (e) {
      setErr(e.message);
    }
  };

  const createGuide = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api("/users/guides", {
        method: "POST",
        body: { name: gName, email: gEmail, password: gPassword },
      });
      setGName("");
      setGEmail("");
      setGPassword("");
      setMsg("Guide account created.");
      loadAll();
    } catch (e) {
      setErr(e.message);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api(`/users/${resetId}/reset-password`, {
        method: "POST",
        body: { new_password: newPassword },
      });
      setNewPassword("");
      setMsg("Password reset successfully.");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <DashboardLayout role="Coordinator">
      <h2>Coordinator Dashboard</h2>
      {err && <div className="alert alert-warning" style={{ marginBottom: 16 }}>{err}</div>}
      {msg && <div className="alert alert-ok" style={{ marginBottom: 16 }}>{msg}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-number">{summary?.total_teams ?? "-"}</div>
          <div className="stat-label">Teams registered</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{summary?.total_projects ?? "-"}</div>
          <div className="stat-label">Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{summary?.total_guides ?? "-"}</div>
          <div className="stat-label">Guides</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{summary?.deadlines_in_7_days ?? "-"}</div>
          <div className="stat-label">Deadlines in 7 days</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{summary?.pending_reviews ?? "-"}</div>
          <div className="stat-label">Pending reviews</div>
        </div>
      </div>

      <div className="inline-form">
        <button type="button" onClick={sendReminders}>
          Send Deadline Reminders Now
        </button>
      </div>

      <h3>Pending Submissions by Deadline</h3>
      <table className="data-table" style={{ marginBottom: 28 }}>
        <thead>
          <tr>
            <th>Deadline</th>
            <th>Due Date</th>
            <th>Pending Teams</th>
          </tr>
        </thead>
        <tbody>
          {pending.length === 0 ? (
            <tr><td colSpan="3">All teams have submitted!</td></tr>
          ) : (
            pending.map((d) => (
              <tr key={d.deadline_id}>
                <td>{d.title} {d.overdue && <span className="match-tag">Overdue</span>}</td>
                <td>{d.due_date}</td>
                <td>{d.pending_teams.map((t) => t.team_name).join(", ")}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h3>Create Guide Account</h3>
      <form className="inline-form" onSubmit={createGuide}>
        <input
          type="text"
          placeholder="Guide name"
          value={gName}
          onChange={(e) => setGName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Guide email"
          value={gEmail}
          onChange={(e) => setGEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          value={gPassword}
          onChange={(e) => setGPassword(e.target.value)}
          minLength={8}
          required
        />
        <button type="submit">Create Guide</button>
      </form>

      <h3>Reset User Password</h3>
      <form className="inline-form" onSubmit={resetPassword}>
        <select value={resetId} onChange={(e) => setResetId(e.target.value)}>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role}) — {u.email}
            </option>
          ))}
        </select>
        <input
          type="password"
          placeholder="New password (min 8 chars)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
        />
        <button type="submit">Reset Password</button>
      </form>
    </DashboardLayout>
  );
}

export default CoordinatorDashboard;
