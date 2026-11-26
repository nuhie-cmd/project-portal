import DashboardLayout from "../components/DashboardLayout";
import { useSchedule } from "../context/DeadlinesContext";
import { STUDENT_TEAM_ID } from "../data/demoTeams";

function StudentDeadlines() {
  const { events } = useSchedule();

  const mine = events
    .filter((e) => e.teamId === "all" || e.teamId === STUDENT_TEAM_ID)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <DashboardLayout role="Student">
      <h2>Schedule</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Title</th>
            <th>Date</th>
            <th>Set by</th>
          </tr>
        </thead>
        <tbody>
          {mine.map((e) => (
            <tr key={e.id}>
              <td>
                <span className={e.type === "Deadline" ? "status-badge waiting" : "status-badge"}>
                  {e.type}
                </span>
              </td>
              <td>{e.title}</td>
              <td>{e.date}</td>
              <td>{e.by}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardLayout>
  );
}

export default StudentDeadlines;