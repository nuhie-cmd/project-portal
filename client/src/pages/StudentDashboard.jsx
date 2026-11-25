import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { apiRequest, getAuthUser } from "../api";

function getBadgeClass(status) {
  if (status === "Approved") return "status-badge status-approved";
  if (status === "Rejected") return "status-badge status-rejected";
  if (status === "Pending") return "status-badge status-pending";
  return "status-badge status-none";
}

function StudentDashboard() {
  const user = getAuthUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await apiRequest("/proposals/my");
        if (active) setData(res);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardLayout title="Student Dashboard">
      <div className="dash-summary">
        <h3 style={{ marginTop: 0, color: "#4338ca" }}>
          Welcome, {user?.name || "Student"}!
        </h3>
        {loading && <p>Loading your project summary...</p>}
        {error && <div className="alert-box alert-error">{error}</div>}
        {!loading && !error && (
          <div>
            {data?.team ? (
              <p>
                <b>Team:</b> {data.team.team_name} | <b>Project:</b>{" "}
                {data.proposal?.title || data.team.project_title} |{" "}
                <b>Status:</b>{" "}
                <span className={getBadgeClass(data.status)}>
                  {data.status || "Proposal Not Submitted"}
                </span>
              </p>
            ) : (
              <p>
                You have not registered a team yet. Start by registering your
                team below.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="dash-card">
          <h3>1. Team Registration</h3>
          <p>
            Register your project team, leader details, and team members in the
            portal.
          </p>
          <Link className="dash-btn" to="/team-registration">
            {data?.team ? "View / Manage Team" : "Register Team"}
          </Link>
        </div>

        <div className="dash-card">
          <h3>2. Project Proposal</h3>
          <p>
            Submit your project problem statement, objectives, technologies, and
            description for guide review.
          </p>
          <Link className="dash-btn" to="/proposal">
            Submit Proposal
          </Link>
        </div>

        <div className="dash-card">
          <h3>3. Project Status</h3>
          <p>
            Track whether your proposal is Pending, Approved, or Rejected and
            read guide feedback.
          </p>
          <Link className="dash-btn" to="/status">
            View Status & Feedback
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StudentDashboard;
