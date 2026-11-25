import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { apiRequest, getAuthUser } from "../api";

function getBadgeClass(status) {
  if (status === "Approved" || status === "Completed") return "status-badge status-approved";
  if (status === "In Progress") return "status-badge status-pending";
  if (status === "Pending") return "status-badge status-pending";
  return "status-badge status-none";
}

function getDeadlineClass(state) {
  if (state === "overdue") return "status-badge status-rejected";
  if (state === "due_soon") return "status-badge status-pending";
  return "status-badge status-approved";
}

function StudentDashboard() {
  const user = getAuthUser();
  const [team, setTeam] = useState(null);
  const [project, setProject] = useState(null);
  const [deadlines, setDeadlines] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [teamRes, projRes, dlRes, subRes] = await Promise.all([
          apiRequest("/teams/mine"),
          apiRequest("/projects/mine"),
          apiRequest("/deadlines"),
          apiRequest("/submissions/mine"),
        ]);
        if (!active) return;
        setTeam(teamRes.team || null);
        setProject(projRes.project || null);
        setDeadlines(dlRes.deadlines || []);
        setSubmissions(subRes.submissions || []);
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
        {loading && <p>Loading your team, project and deadlines...</p>}
        {error && <div className="alert-box alert-error">{error}</div>}
        {!loading && !error && (
          <div>
            {team ? (
              <p>
                <b>Team:</b> {team.name} ({team.members?.length || 1} member
                {(team.members?.length || 1) === 1 ? "" : "s"}) |{" "}
                <b>Project:</b> {project ? project.title : "Not registered yet"} |{" "}
                <b>Status:</b>{" "}
                <span className={getBadgeClass(project?.status)}>
                  {project?.status || "No Proposal"}
                </span>{" "}
                | <b>Guide:</b> {project?.guide_name || "Awaiting allocation"}
              </p>
            ) : (
              <p>
                You are not in a team yet. Register your team or ask your team leader
                to add you by USN.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="dash-card">
          <h3>1. Team Registration</h3>
          <p>
            Create your project team and add members using their registered student USN
            (up to 4 members).
          </p>
          <Link className="dash-btn" to="/team-registration">
            {team ? "View / Manage Team" : "Register Team"}
          </Link>
        </div>

        <div className="dash-card">
          <h3>2. Project Proposal</h3>
          <p>
            Team leaders submit the project title, description, objectives, and scope
            for guide review.
          </p>
          <Link className="dash-btn" to="/proposal">
            {project ? "View Proposal" : "Submit Proposal"}
          </Link>
        </div>

        <div className="dash-card">
          <h3>3. Status, Files &amp; Feedback</h3>
          <p>
            Track project status, view upcoming deadlines, upload submission files, and
            read guide feedback ({submissions.length} uploaded).
          </p>
          <Link className="dash-btn" to="/status">
            Open Status &amp; Uploads
          </Link>
        </div>
      </div>

      {!loading && deadlines.length > 0 && (
        <div className="dash-summary" style={{ marginTop: "24px" }}>
          <h3 style={{ marginTop: 0, color: "#4338ca" }}>Project Deadlines</h3>
          <div className="table-wrapper">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Due Date</th>
                  <th>Timeline</th>
                  <th>Submission</th>
                </tr>
              </thead>
              <tbody>
                {deadlines.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <b>{d.title}</b>
                      {d.description && (
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          {d.description}
                        </div>
                      )}
                    </td>
                    <td>{new Date(d.due_date).toLocaleString()}</td>
                    <td>
                      <span className={getDeadlineClass(d.state)}>
                        {d.state.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          d.submitted
                            ? "status-badge status-approved"
                            : "status-badge status-none"
                        }
                      >
                        {d.submitted ? "Submitted" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default StudentDashboard;
