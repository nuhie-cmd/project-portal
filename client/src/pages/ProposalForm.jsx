import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, getAuthUser } from "../api";
import "./ProposalForm.css";

function ProposalForm() {
  const user = getAuthUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState("");
  const [scope, setScope] = useState("");

  const [team, setTeam] = useState(null);
  const [existingProject, setExistingProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [teamRes, projRes] = await Promise.all([
          apiRequest("/teams/mine"),
          apiRequest("/projects/mine"),
        ]);
        if (!active) return;
        setTeam(teamRes.team || null);
        setExistingProject(projRes.project || null);
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

  const isLeader = team && team.leader_id === user?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim() || !description.trim()) {
      setError("Project title and description are required.");
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest("/projects", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          objectives: objectives.trim() || null,
          scope: scope.trim() || null,
        }),
      });

      const projRes = await apiRequest("/projects/mine");
      setExistingProject(projRes.project || { title: title.trim(), status: "Pending" });
      setSuccess("Project proposal submitted successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="proposal-page">
      <div className="proposal-card">
        <div className="page-nav">
          <Link className="back-link" to="/student">
            &larr; Back to Dashboard
          </Link>
          <Link className="back-link" to="/status">
            View Status &amp; Upload Files &rarr;
          </Link>
        </div>

        <h1>Project Proposal</h1>
        <p>Submit your project idea for guide approval</p>

        {error && <div className="alert-box alert-error">{error}</div>}
        {success && <div className="alert-box alert-success">{success}</div>}

        {loading ? (
          <p>Checking team and proposal status...</p>
        ) : !team ? (
          <div className="alert-box alert-error">
            You must register or join a team before submitting a proposal.{" "}
            <Link to="/team-registration" style={{ fontWeight: "bold" }}>
              Go to Team Registration
            </Link>
            .
          </div>
        ) : existingProject ? (
          <div className="alert-box alert-info">
            Your team (<b>{team.name}</b>) has already registered the project{" "}
            <b>{existingProject.title}</b> (Status: <b>{existingProject.status}</b>).{" "}
            <Link to="/status" style={{ fontWeight: "bold" }}>
              View status, deadlines &amp; upload files
            </Link>
            .
          </div>
        ) : !isLeader ? (
          <div className="alert-box alert-info">
            Only the team leader can register the project proposal for <b>{team.name}</b>.
          </div>
        ) : (
          <>
            <div className="alert-box alert-info">
              Submitting proposal for team: <b>{team.name}</b>
            </div>

            <form onSubmit={handleSubmit}>
              <label>Project Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter project title"
                required
              />

              <label>Project Description &amp; Problem Statement</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the problem and proposed solution"
                required
              />

              <label>Objectives</label>
              <textarea
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="Enter measurable project objectives"
                required
              />

              <label>Scope &amp; Technologies</label>
              <textarea
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="Example: Web app for campus library using React, Express, MySQL"
                required
              />

              <button type="submit" disabled={submitting}>
                {submitting ? "Submitting Proposal..." : "Submit Proposal"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default ProposalForm;
