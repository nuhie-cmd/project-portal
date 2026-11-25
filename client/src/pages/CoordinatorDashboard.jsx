import DashboardLayout from "../components/DashboardLayout";

const links = [
  "Dashboard",
  "Manage users",
  "Teams",
  "All projects",
  "Deadlines",
  "Reports",
];

function CoordinatorDashboard() {
  return (
    <DashboardLayout role="Coordinator" links={links} active="Dashboard">
      <h2>Dashboard</h2>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-number">42</div>
          <div className="stat-label">Teams registered</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">6</div>
          <div className="stat-label">Teams without a guide</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">11</div>
          <div className="stat-label">Pending proposals</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">2</div>
          <div className="stat-label">Deadlines in 7 days</div>
        </div>
      </div>

      <h3>Upcoming deadlines</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Milestone</th>
            <th>Due date</th>
            <th>Teams yet to submit</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Synopsis submission</td>
            <td>dd/mm/yyyy</td>
            <td>9</td>
          </tr>
          <tr>
            <td>Review 1</td>
            <td>dd/mm/yyyy</td>
            <td>42</td>
          </tr>
        </tbody>
      </table>
    </DashboardLayout>
  );
}

export default CoordinatorDashboard;