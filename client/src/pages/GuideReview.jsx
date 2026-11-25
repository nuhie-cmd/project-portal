import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { apiRequest } from "../api";
import "./GuideReview.css";

function getBadgeClass(status) {
  if (status === "Approved") return "status-badge status-approved";
  if (status === "Rejected") return "status-badge status-rejected";
  return "status-badge status-pending";
}

function GuideReview() {
  const { proposalId: paramId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedIdFromUrl = paramId || searchParams.get("proposalId") || "";

  const [proposals, setProposals] = useState([]);
  const [selectedId, setSelectedId] = useState(selectedIdFromUrl);
  const [detail, setDetail] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    async function loadList() {
      try {
        const res = await apiRequest("/guide/proposals");
        if (!active) return;
        const list = res.proposals || [];
        setProposals(list);
        if (!selectedIdFromUrl && list.length > 0) {
          setSelectedId(String(list[0].id));
        } else if (selectedIdFromUrl) {
          setSelectedId(String(selectedIdFromUrl));
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoadingList(false);
      }
    }
    loadList();
    return () => {
      active = false;
    };
  }, [selectedIdFromUrl]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    let active = true;
    async function loadDetail() {
      setLoadingDetail(true);
      setError("");
      try {
        const res = await apiRequest(`/guide/proposals/${selectedId}`);
        if (!active) return;
        setDetail(res);
        setFeedback(res.proposal?.latest_feedback || "");
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoadingDetail(false);
      }
    }
    loadDetail();
    return () => {
      active = false;
    };
  }, [selectedId]);

  const handleSelectChange = (newId) => {
    setSuccess("");
    setError("");
    setSelectedId(newId);
    setSearchParams({ proposalId: newId });
  };

  const handleDecision = async (decision) => {
    setError("");
    setSuccess("");

    if (!detail?.proposal?.id) {
      setError("No proposal selected.");
      return;
    }
    if (!feedback.trim()) {
      setError("Please enter guide feedback before approving or rejecting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest(
        `/guide/proposals/${detail.proposal.id}/review`,
        {
          method: "POST",
          body: JSON.stringify({
            decision,
            feedback: feedback.trim(),
          }),
        }
      );

      setDetail((prev) => ({
        ...prev,
        proposal: {
          ...prev.proposal,
          status: res.status,
          latest_feedback: res.feedback,
        },
        reviews: res.reviews || prev.reviews,
      }));
      setProposals((prev) =>
        prev.map((p) =>
          p.id === detail.proposal.id ? { ...p, status: res.status } : p
        )
      );
      setSuccess(res.message || `Proposal ${decision.toLowerCase()} successfully.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const proposal = selectedId ? detail?.proposal : null;
  const members = selectedId ? detail?.members || [] : [];

  return (
    <div className="review-page">
      <div className="review-card">
        <div className="page-nav">
          <Link className="back-link" to="/guide">
            &larr; Back to Dashboard
          </Link>
          <Link className="back-link" to="/guide-teams">
            Team List &rarr;
          </Link>
        </div>

        <h1>Guide Review</h1>
        <p>Review and approve student project proposals</p>

        {error && <div className="alert-box alert-error">{error}</div>}
        {success && <div className="alert-box alert-success">{success}</div>}

        {loadingList ? (
          <p>Loading submitted proposals...</p>
        ) : proposals.length === 0 ? (
          <div className="alert-box alert-info">
            No project proposals have been submitted yet.
          </div>
        ) : (
          <>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "6px" }}>
              Select Proposal to Review
            </label>
            <select
              value={selectedId}
              onChange={(e) => handleSelectChange(e.target.value)}
            >
              {proposals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.team_name} — {p.title} ({p.status})
                </option>
              ))}
            </select>

            {loadingDetail ? (
              <p>Loading proposal details...</p>
            ) : proposal ? (
              <>
                <h3>Team Details</h3>
                <p>
                  <b>Team Name:</b> {proposal.team_name}
                </p>
                <p>
                  <b>Project Title:</b> {proposal.title}
                </p>
                <p>
                  <b>Team Leader:</b> {proposal.leader_name} ({proposal.leader_usn})
                </p>
                {members.length > 0 && (
                  <p>
                    <b>Team Members:</b>{" "}
                    {members
                      .map((m) => `${m.member_name} (${m.member_usn})`)
                      .join(", ")}
                  </p>
                )}

                <h3>Problem Statement</h3>
                <p>{proposal.problem_statement}</p>

                <h3>Objectives</h3>
                <p>{proposal.objectives}</p>

                <h3>Technologies Used</h3>
                <p>{proposal.technologies_used}</p>

                <h3>Project Description</h3>
                <p>{proposal.description}</p>

                <h3>Guide Feedback</h3>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter your feedback"
                />

                <h3>
                  Proposal Status:{" "}
                  <span className={getBadgeClass(proposal.status)}>
                    {proposal.status}
                  </span>
                </h3>

                <button
                  type="button"
                  className="approve-btn"
                  disabled={submitting}
                  onClick={() => handleDecision("Approved")}
                >
                  {submitting ? "Saving..." : "Approve"}
                </button>

                <button
                  type="button"
                  className="reject-btn"
                  disabled={submitting}
                  onClick={() => handleDecision("Rejected")}
                >
                  {submitting ? "Saving..." : "Reject"}
                </button>
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export default GuideReview;
