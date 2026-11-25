import DashboardLayout from "../components/DashboardLayout";
import { studentStats, studentTasks, teamProject } from "../data/dummyData";

const links = [
  "Dashboard",
  "My team",
  "Proposal",
  "Feedback",
  "Deadlines",
];

function StudentDashboard() {
  const approved = teamProject.status === "Approved";

  return (
    <DashboardLayout role="Student" links={links} active="Dashboard">
      <h2>Dashboard</h2>

      <div className="project-card">
        <h3>Your project</h3>
        {approved ? (
          <>
            <span className="status-badge">Approved</span>
            <p><strong>{teamProject.title}</strong></p>
            <p>{teamProject.problemStatement}</p>
            <p>Team: {teamProject.members.join(", ")}</p>
            <p>Guide: {teamProject.guide}</p>
          </>
        ) : (
          <>
            <span className="status-badge waiting">{teamProject.status}</span>
            <p>No approved topic yet. Submit a proposal to get started.</p>
          </>
        )}
      </div>

      <div className="stat-grid">
        {studentStats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-number">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <h3>My milestones</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Milestone</th>
            <th>Due date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {studentTasks.map((t) => (
            <tr key={t.milestone}>
              <td>{t.milestone}</td>
              <td>{t.dueDate}</td>
              <td>{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardLayout>
  );
}

export default StudentDashboard;