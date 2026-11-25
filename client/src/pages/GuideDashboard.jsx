import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { apiRequest, getAuthUser } from "../api";

function GuideDashboard() {
  const user = getAuthUser();
  const [teams, setTeams] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [teamsRes, proposalsRes] = await Promise.all([
          apiRequest("/guide/teams"),
          apiRequest("/guide/proposals"),
        ]);
        if (active) {
          setTeams(teamsRes.teams || []);
          setProposals(proposalsRes.proposals || []);
        }
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

  const pendingCount = proposals.filter((p) => p.status === "Pending").length;
  const reviewedCount = proposals.filter((p) => p.status !== "Pending").length;

  return (
    <DashboardLayout title="Guide Dashboard">
      <div className="dash-summary">
        <h3 style={{ marginTop: 0, color: "#4338ca" }}>
          Welcome, {user?.name || "Guide"}!
        </h3>
        {loading && <p>Loading guide overview...</p>}
        {error && <div className="alert-box alert-error">{error}</div>}
        {!loading && !error && (
          <p>
            <b>Teams Available:</b> {teams.length} | <b>Pending Proposals:</b>{" "}
            {pendingCount} | <b>Reviewed Proposals:</b> {reviewedCount}
          </p>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="dash-card">
          <h3>Assigned & Registered Teams</h3>
          <p>
            View all student teams, team leaders, member counts, and current
            proposal status.
          </p>
          <Link className="dash-btn" to="/guide-teams">
            View Team List ({teams.length})
          </Link>
        </div>

        <div className="dash-card">
          <h3>Review Proposals</h3>
          <p>
            Open submitted proposals, provide constructive feedback, and approve
            or reject projects.
          </p>
          <Link className="dash-btn" to="/guide-review">
            Review Proposals ({pendingCount} Pending)
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default GuideDashboard;
