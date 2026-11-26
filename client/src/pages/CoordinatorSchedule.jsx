import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "../api";

function CoordinatorSchedule() {
  const [deadlines, setDeadlines] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadAll = async () => {
    try {
      const [dRes, mRes] = await Promise.all([
        api("/deadlines"),
        api("/meetings/all"),
      ]);
      setDeadlines(dRes.deadlines || []);
      setMeetings(mRes.meetings || []);
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const createDeadline = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api("/deadlines", {
        method: "POST",
        body: { title, description, due_date: dueDate },
      });
      setTitle("");
      setDescription("");
      setDueDate("");
      setMsg("Deadline created.");
      loadAll();
    } catch (e) {
      setErr(e.message);
    }
  };

  const deleteDeadline = async (id) => {
    setErr("");
    setMsg("");
    try {
      await api(`/deadlines/${id}`, { method: "DELETE" });
      setMsg("Deadline deleted.");
      loadAll();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <DashboardLayout role="Coordinator">
      <h2>Schedule &amp; Deadlines</h2>
      {err && <div className="alert alert-warning" style={{ marginBottom: 16 }}>{err}</div>}
      {msg && <div className="alert alert-ok" style={{ marginBottom: 16 }}>{msg}</div>}

      <h3>Create Deadline</h3>
      <form className="inline-form" onSubmit={createDeadline}>
        <input
          type="text"
          placeholder="Title (e.g. Review 3)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
        <button type="submit">Add Deadline</button>
      </form>

      <h3>All Deadlines</h3>
      <table className="data-table" style={{ marginBottom: 28 }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Due Date</th>
            <th>State</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {deadlines.map((d) => (
            <tr key={d.id}>
              <td>{d.title}</td>
              <td>{d.description || "-"}</td>
              <td>{d.due_date}</td>
              <td>{d.state}</td>
              <td>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => deleteDeadline(d.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>All Meetings</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>Guide</th>
            <th>Date &amp; Time</th>
            <th>Agenda</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {meetings.length === 0 ? (
            <tr><td colSpan="5">No meetings scheduled.</td></tr>
          ) : (
            meetings.map((m) => (
              <tr key={m.id}>
                <td>{m.team_name}</td>
                <td>{m.guide_name || "-"}</td>
                <td>{m.scheduled_at}</td>
                <td>{m.agenda || "-"}</td>
                <td>{m.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </DashboardLayout>
  );
}

export default CoordinatorSchedule;
