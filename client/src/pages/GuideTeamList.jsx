import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, getAuthUser, getDashboardPath } from "../api";
import "./GuideTeamList.css";

function getBadgeClass(status) {
  if (status === "Approved") return "status-badge status-approved";
  if (status === "Rejected") return "status-badge status-rejected";
  if (status === "Pending") return "status-badge status-pending";
  return "status-badge status-none";
}

function GuideTeamList() {
  const navigate = useNavigate();
  const user = getAuthUser();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await apiRequest("/guide/teams");
        if (active) setTeams(res.teams || []);
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
    <div className="guide-list-page">
      <div className="guide-list-card">
        <div className="page-nav">
          <Link className="back-link" to={getDashboardPath(user?.role)}>
            &larr; Back to Dashboard
          </Link>
          {user?.role === "guide" && (
            <Link className="back-link" to="/guide-review">
              Review Proposals &rarr;
            </Link>
          )}
        </div>

        <h1>Guide Team List</h1>
        <p>View all registered project teams</p>

        {error && <div className="alert-box alert-error">{error}</div>}

        {loading ? (
          <p style={{ textAlign: "center" }}>Loading teams...</p>
        ) : (
          <>
            <h3>Total Teams: {teams.length}</h3>

            {teams.length === 0 ? (
              <div className="alert-box alert-info">
                No student teams have been registered yet.
              </div>
            ) : (
              teams.map((team) => (
                <div className="guide-team" key={team.id}>
                  <h2>{team.team_name}</h2>
                  <p>
                    <b>Project:</b> {team.proposal_title || team.project_title}
                  </p>
                  <p>
                    <b>Team Leader:</b> {team.leader_name} ({team.leader_usn})
                  </p>
                  <p>
                    <b>Members:</b> {team.member_count}
                  </p>
                  <p>
                    <b>Guide:</b> {team.guide_name || "Unassigned (Available for review)"}
                  </p>
                  <p>
                    <b>Status:</b>{" "}
                    <span className={getBadgeClass(team.status)}>
                      {team.status}
                    </span>
                  </p>
                  {user?.role === "guide" && (
                    <button
                      type="button"
                      disabled={!team.proposal_id}
                      onClick={() =>
                        navigate(`/guide-review?proposalId=${team.proposal_id}`)
                      }
                    >
                      {team.proposal_id ? "View Proposal" : "No Proposal Submitted Yet"}
                    </button>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default GuideTeamList;
