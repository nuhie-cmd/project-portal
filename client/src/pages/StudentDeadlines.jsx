import DashboardLayout from "../components/DashboardLayout";
import { useDeadlines } from "../context/DeadlinesContext";

function StudentDeadlines() {
  const { deadlines } = useDeadlines();
  const sorted = [...deadlines].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate)
  );

  return (
    <DashboardLayout role="Student">
      <h2>Deadlines</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Milestone</th>
            <th>Due date</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d) => (
            <tr key={d.id}>
              <td>{d.milestone}</td>
              <td>{d.dueDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardLayout>
  );
}

export default StudentDeadlines;