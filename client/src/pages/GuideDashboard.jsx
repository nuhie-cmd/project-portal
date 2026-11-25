import DashboardLayout from "../components/DashboardLayout";
import { guideStats, guideTeams } from "../data/dummyData";

const links = [
  "Dashboard",
  "My teams",
  "Proposals to review",
  "Milestones",
  "Feedback given",
];

function GuideDashboard() {
  return (
    <DashboardLayout role="Guide" links={links} active="Dashboard">
      <h2>Dashboard</h2>

      <div className="stat-grid">
        {guideStats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-number">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <h3>My teams</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>Project</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {guideTeams.map((t) => (
            <tr key={t.team}>
              <td>{t.team}</td>
              <td>{t.project}</td>
              <td>{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardLayout>
  );
}

export default GuideDashboard;