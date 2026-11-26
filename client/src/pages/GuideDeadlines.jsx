import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useDeadlines } from "../context/DeadlinesContext";

function GuideDeadlines() {
  const { deadlines, addDeadline, removeDeadline } = useDeadlines();
  const [milestone, setMilestone] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!milestone || !dueDate) return;
    addDeadline({ milestone, dueDate });
    setMilestone("");
    setDueDate("");
  };

  const sorted = [...deadlines].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate)
  );

  return (
    <DashboardLayout role="Guide">
      <h2>Deadlines</h2>

      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Milestone (e.g. Review 2)"
          value={milestone}
          onChange={(e) => setMilestone(e.target.value)}
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <button type="submit">Set deadline</button>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Milestone</th>
            <th>Due date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d) => (
            <tr key={d.id}>
              <td>{d.milestone}</td>
              <td>{d.dueDate}</td>
              <td>
                <button className="link-button" onClick={() => removeDeadline(d.id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardLayout>
  );
}

export default GuideDeadlines;