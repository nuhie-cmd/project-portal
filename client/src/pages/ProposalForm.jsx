import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api";
import "./ProposalForm.css";

function ProposalForm() {
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [objectives, setObjectives] = useState("");
  const [technology, setTechnology] = useState("");
  const [description, setDescription] = useState("");

  const [team, setTeam] = useState(null);
  const [existingStatus, setExistingStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await apiRequest("/proposals/my");
        if (active) {
          setTeam(res.team || null);
          setExistingStatus(res.status || null);
          if (res.team?.project_title) {
            setTitle((prev) => prev || res.team.project_title);
          }
          if (res.proposal && res.status === "Rejected") {
            setTitle(res.proposal.title || "");
            setProblem(res.proposal.problem_statement || "");
            setObjectives(res.proposal.objectives || "");
            setTechnology(res.proposal.technologies_used || "");
            setDescription(res.proposal.description || "");
          }
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

  const canSubmit =
    Boolean(team) &&
    existingStatus !== "Pending" &&
    existingStatus !== "Approved";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!canSubmit) {
      setError("You cannot submit a proposal right now.");
      return;
    }

    if (
      !title.trim() ||
      !problem.trim() ||
      !objectives.trim() ||
      !technology.trim() ||
      !description.trim()
    ) {
      setError("Please fill in all proposal fields.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiRequest("/proposals", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          problemStatement: problem.trim(),
          objectives: objectives.trim(),
          technologiesUsed: technology.trim(),
          description: description.trim(),
        }),
      });
      setExistingStatus(data.status || "Pending");
      setSuccess("Project proposal submitted successfully! Your proposal is now Pending guide review.");
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
            View Status &rarr;
          </Link>
        </div>

        <h1>Project Proposal</h1>
        <p>Submit your project idea for guide approval</p>

        {error && <div className="alert-box alert-error">{error}</div>}
        {success && <div className="alert-box alert-success">{success}</div>}

        {loading ? (
          <p>Checking team registration...</p>
        ) : !team ? (
          <div className="alert-box alert-error">
            You must register a team before submitting a proposal.{" "}
            <Link to="/team-registration" style={{ fontWeight: "bold" }}>
              Register your team here
            </Link>
            .
          </div>
        ) : (
          <>
            <div className="alert-box alert-info">
              Submitting for team: <b>{team.team_name}</b>
            </div>

            {existingStatus === "Pending" || existingStatus === "Approved" ? (
              <div className="alert-box alert-info">
                Your team already has a proposal with status{" "}
                <b>{existingStatus}</b>.{" "}
                <Link to="/status" style={{ fontWeight: "bold" }}>
                  Track status &amp; feedback
                </Link>
                .
              </div>
            ) : (
              <>
                {existingStatus === "Rejected" && (
                  <div className="alert-box alert-error">
                    Your previous proposal was rejected. Update the details below
                    and resubmit for review.
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <label>Project Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter project title"
                    required
                  />

                  <label>Problem Statement</label>
                  <textarea
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="Describe the problem"
                    required
                  />

                  <label>Objectives</label>
                  <textarea
                    value={objectives}
                    onChange={(e) => setObjectives(e.target.value)}
                    placeholder="Enter project objectives"
                    required
                  />

                  <label>Technologies Used</label>
                  <input
                    value={technology}
                    onChange={(e) => setTechnology(e.target.value)}
                    placeholder="Example: Python, React, MySQL"
                    required
                  />

                  <label>Project Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain your project"
                    required
                  />

                  <button type="submit" disabled={submitting}>
                    {submitting ? "Submitting Proposal..." : "Submit Proposal"}
                  </button>
                </form>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ProposalForm;
