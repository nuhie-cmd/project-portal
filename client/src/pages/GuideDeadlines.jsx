import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "../api";

function GuideDeadlines() {
  const [deadlines, setDeadlines] = useState([]);
  const [projects, setProjects] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [agenda, setAgenda] = useState("");
  const [notesText, setNotesText] = useState({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadAll = async () => {
    try {
      const [dRes, pRes, mRes] = await Promise.all([
        api("/deadlines"),
        api("/projects/assigned"),
        api("/meetings/assigned"),
      ]);
      setDeadlines(dRes.deadlines || []);
      setProjects(pRes.projects || []);
      setMeetings(mRes.meetings || []);
      if (pRes.projects?.length && !projectId) {
        setProjectId(String(pRes.projects[0].id));
      }
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const scheduleMeeting = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api("/meetings", {
        method: "POST",
        body: {
          project_id: Number(projectId),
          scheduled_at: scheduledAt.replace("T", " "),
          agenda,
        },
      });
      setScheduledAt("");
      setAgenda("");
      setMsg("Meeting scheduled!");
      loadAll();
    } catch (e) {
      setErr(e.message);
    }
  };

  const saveNotes = async (meetingId) => {
    const notes = (notesText[meetingId] || "").trim();
    if (!notes) return;
    setErr("");
    setMsg("");
    try {
      await api(`/meetings/${meetingId}/notes`, {
        method: "PUT",
        body: { notes },
      });
      setNotesText((prev) => ({ ...prev, [meetingId]: "" }));
      setMsg("Meeting notes saved.");
      loadAll();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <DashboardLayout role="Guide">
      <h2>Schedule &amp; Meetings</h2>
      {err && <div className="alert alert-warning" style={{ marginBottom: 16 }}>{err}</div>}
      {msg && <div className="alert alert-ok" style={{ marginBottom: 16 }}>{msg}</div>}

      <h3>Schedule a Meeting</h3>
      <form className="inline-form" onSubmit={scheduleMeeting}>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.team_name} — {p.title}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Agenda"
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
        />
        <button type="submit">Schedule Meeting</button>
      </form>

      <h3>My Scheduled Meetings</h3>
      <table className="data-table" style={{ marginBottom: 28 }}>
        <thead>
          <tr>
            <th>Team</th>
            <th>Date &amp; Time</th>
            <th>Agenda</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {meetings.length === 0 ? (
            <tr><td colSpan="5">No meetings yet.</td></tr>
          ) : (
            meetings.map((m) => (
              <tr key={m.id}>
                <td>{m.team_name}</td>
                <td>{m.scheduled_at}</td>
                <td>{m.agenda || "-"}</td>
                <td>{m.status}</td>
                <td>
                  {m.notes ? (
                    m.notes
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Add meeting notes..."
                        value={notesText[m.id] || ""}
                        onChange={(e) => setNotesText((prev) => ({ ...prev, [m.id]: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() => saveNotes(m.id)}
                        style={{ padding: "6px 12px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
                      >
                        Save
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h3>Department Deadlines</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Due Date</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          {deadlines.map((d) => (
            <tr key={d.id}>
              <td>{d.title}</td>
              <td>{d.description || "-"}</td>
              <td>{d.due_date}</td>
              <td>{d.state}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardLayout>
  );
}

export default GuideDeadlines;
