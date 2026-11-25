import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { apiRequest, getAuthUser } from "../api";

function getBadgeClass(status) {
  if (status === "Approved") return "status-badge status-approved";
  if (status === "Rejected") return "status-badge status-rejected";
  if (status === "Pending") return "status-badge status-pending";
  return "status-badge status-none";
}

function CoordinatorDashboard() {
  const user = getAuthUser();
  const [teams, setTeams] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingTeamId, setSavingTeamId] = useState(null);

  const loadOverview = useCallback(async () => {
    try {
      const data = await apiRequest("/coordinator/overview");
      setTeams(data.teams || []);
      setGuides(data.guides || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const data = await apiRequest("/coordinator/overview");
        if (active) {
          setTeams(data.teams || []);
          setGuides(data.guides || []);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, []);

  const handleAssignGuide = async (teamId, guideIdValue) => {
    setError("");
    setMessage("");
    setSavingTeamId(teamId);
    try {
      await apiRequest(`/coordinator/teams/${teamId}/assign-guide`, {
        method: "PATCH",
        body: JSON.stringify({
          guideId: guideIdValue ? Number(guideIdValue) : null,
        }),
      });
      setMessage("Guide assignment updated.");
      await loadOverview();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingTeamId(null);
    }
  };

  const approvedCount = teams.filter((t) => t.status === "Approved").length;
  const pendingCount = teams.filter((t) => t.status === "Pending").length;

  return (
    <DashboardLayout title="Coordinator Dashboard">
      <div className="dash-summary">
        <h3 style={{ marginTop: 0, color: "#4338ca" }}>
          Welcome, {user?.name || "Coordinator"}!
        </h3>
        <p>
          <b>Total Teams:</b> {teams.length} | <b>Pending:</b> {pendingCount} |{" "}
          <b>Approved:</b> {approvedCount} | <b>Registered Guides:</b>{" "}
          {guides.length}
        </p>
      </div>

      {message && (
        <div className="alert-box alert-success" style={{ marginTop: "16px" }}>
          {message}
        </div>
      )}
      {error && (
        <div className="alert-box alert-error" style={{ marginTop: "16px" }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ marginTop: "20px" }}>Loading teams and proposals...</p>
      ) : teams.length === 0 ? (
        <div className="dash-summary" style={{ marginTop: "20px" }}>
          <p>No teams have registered yet.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Project Title</th>
                <th>Leader</th>
                <th>Members</th>
                <th>Status</th>
                <th>Assigned Guide</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id}>
                  <td>{team.team_name}</td>
                  <td>{team.project_title}</td>
                  <td>
                    {team.leader_name} ({team.leader_usn})
                  </td>
                  <td>{team.member_count}</td>
                  <td>
                    <span className={getBadgeClass(team.status)}>
                      {team.status}
                    </span>
                  </td>
                  <td>
                    <select
                      value={team.guide_id || ""}
                      disabled={savingTeamId === team.id}
                      onChange={(e) => handleAssignGuide(team.id, e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {guides.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

export default CoordinatorDashboard;
