import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api";
import "./StudentStatus.css";

function getStatusClass(status) {
  if (status === "Approved") return "status-approved";
  if (status === "Rejected") return "status-rejected";
  return "status-pending";
}

function getStatusDescription(status) {
  if (status === "Approved") {
    return "Congratulations! Your project proposal has been approved by your guide.";
  }
  if (status === "Rejected") {
    return "Your proposal needs revisions. Check the guide feedback below and resubmit.";
  }
  return "Your proposal is waiting for guide approval.";
}

function StudentStatus() {
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

  const team = data?.team;
  const proposal = data?.proposal;
  const status = data?.status || "Pending";
  const latestReview = data?.latestReview;

  return (
    <div className="status-page">
      <div className="status-card">
        <div className="page-nav">
          <Link className="back-link" to="/student">
            &larr; Back to Dashboard
          </Link>
          <Link className="back-link" to="/proposal">
            Proposal Form &rarr;
          </Link>
        </div>

        <h1>Student Project Status</h1>
        <p>Track your project proposal progress</p>

        {error && <div className="alert-box alert-error">{error}</div>}

        {loading ? (
          <p style={{ textAlign: "center" }}>Loading project status...</p>
        ) : !team ? (
          <div className="alert-box alert-info">
            No team found for your account yet.{" "}
            <Link to="/team-registration" style={{ fontWeight: "bold" }}>
              Register your team
            </Link>
            .
          </div>
        ) : !proposal ? (
          <div className="status-details">
            <h3>Team Registered</h3>
            <p>
              <b>Team Name:</b> {team.team_name}
            </p>
            <p>
              <b>Project Title:</b> {team.project_title}
            </p>
            <p>
              <b>Guide Name:</b> {team.guide_name || "Awaiting Guide Assignment"}
            </p>
            <p>
              You have not submitted a project proposal yet.{" "}
              <Link to="/proposal" style={{ fontWeight: "bold" }}>
                Submit Proposal
              </Link>
            </p>
          </div>
        ) : (
          <>
            <div className="status-details">
              <h3>Project Details</h3>
              <p>
                <b>Team Name:</b> {team.team_name}
              </p>
              <p>
                <b>Project Title:</b> {proposal.title}
              </p>
              <p>
                <b>Submission Date:</b>{" "}
                {new Date(proposal.submitted_at).toLocaleDateString()}
              </p>
              <p>
                <b>Guide Name:</b>{" "}
                {latestReview?.guide_name || team.guide_name || "Pending Guide Review"}
              </p>
              <p>
                <b>Technologies:</b> {proposal.technologies_used}
              </p>
            </div>

            <div className="status-box">
              <h3>Proposal Status</h3>
              <span className={getStatusClass(status)}>{status}</span>
              <p>{getStatusDescription(status)}</p>
              {status === "Rejected" && (
                <p>
                  <Link to="/proposal" style={{ fontWeight: "bold" }}>
                    Revise &amp; Resubmit Proposal
                  </Link>
                </p>
              )}
            </div>

            <div className="feedback-box">
              <h3>Guide Feedback</h3>
              {latestReview?.feedback || proposal.remarks ? (
                <>
                  <p>{latestReview?.feedback || proposal.remarks}</p>
                  {latestReview && (
                    <p style={{ fontSize: "13px", color: "#64748b" }}>
                      Reviewed by {latestReview.guide_name} on{" "}
                      {new Date(latestReview.reviewed_at).toLocaleString()}
                    </p>
                  )}
                </>
              ) : (
                <p>No feedback available yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default StudentStatus;
