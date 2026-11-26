import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "../api";

function StudentDeadlines() {
  const [deadlines, setDeadlines] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api("/deadlines"), api("/meetings/mine")])
      .then(([d, m]) => {
        setDeadlines(d.deadlines || []);
        setMeetings(m.meetings || []);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <DashboardLayout role="Student">
      <h2>Schedule &amp; Deadlines</h2>
      {error && <div className="alert alert-warning">{error}</div>}

      <h3>Deadlines</h3>
      <table className="data-table" style={{ marginBottom: 28 }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Due Date</th>
            <th>State</th>
            <th>Submitted</th>
          </tr>
        </thead>
        <tbody>
          {deadlines.map((d) => (
            <tr key={d.id}>
              <td>{d.title}</td>
              <td>{d.description || "-"}</td>
              <td>{d.due_date}</td>
              <td>
                <span className={d.state === "overdue" || d.state === "due_soon" ? "status-badge waiting" : "status-badge"}>
                  {d.state}
                </span>
              </td>
              <td>{d.submitted ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>My Team Meetings</h3>
      <table className="data-table">
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
    </DashboardLayout>
  );
}

export default StudentDeadlines;
