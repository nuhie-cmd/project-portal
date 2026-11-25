import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiDownload, apiRequest, apiUpload } from "../api";
import "./StudentStatus.css";

function getStatusClass(status) {
  if (status === "Approved" || status === "Completed") return "status-approved";
  if (status === "In Progress") return "status-inprogress";
  return "status-pending";
}

function getStatusDescription(status) {
  if (status === "Approved") {
    return "Your project proposal has been approved by your guide.";
  }
  if (status === "In Progress") {
    return "Your project is currently In Progress. Keep submitting deliverables on time.";
  }
  if (status === "Completed") {
    return "Congratulations! Your project has been marked as Completed.";
  }
  return "Your proposal is Pending review / guide allocation.";
}

function getDeadlineBadgeClass(state) {
  if (state === "overdue") return "status-badge status-rejected";
  if (state === "due_soon") return "status-badge status-pending";
  return "status-badge status-approved";
}

function StudentStatus() {
  const [team, setTeam] = useState(null);
  const [project, setProject] = useState(null);
  const [deadlines, setDeadlines] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [selectedDeadlineId, setSelectedDeadlineId] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAll = useCallback(async () => {
    const [teamRes, projRes, dlRes, subRes] = await Promise.all([
      apiRequest("/teams/mine"),
      apiRequest("/projects/mine"),
      apiRequest("/deadlines"),
      apiRequest("/submissions/mine"),
    ]);
    setTeam(teamRes.team || null);
    setProject(projRes.project || null);
    const dlList = dlRes.deadlines || [];
    setDeadlines(dlList);
    setSelectedDeadlineId((prev) => prev || (dlList[0] ? String(dlList[0].id) : ""));
    setSubmissions(subRes.submissions || []);
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
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
        const dlList = dlRes.deadlines || [];
        setDeadlines(dlList);
        if (dlList.length > 0) {
          setSelectedDeadlineId(String(dlList[0].id));
        }
        setSubmissions(subRes.submissions || []);
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

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedDeadlineId) {
      setError("Please select a deadline.");
      return;
    }
    if (!file) {
      setError("Please choose a file (.pdf, .doc, .docx, .ppt, .pptx, .zip).");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("deadline_id", selectedDeadlineId);
      formData.append("file", file);
      await apiUpload("/submissions", formData);
      setFile(null);
      e.target.reset();
      await loadAll();
      setSuccess("File uploaded successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (submissionId) => {
    setError("");
    try {
      await apiDownload(`/submissions/${submissionId}/download`, `submission-${submissionId}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const allFeedback = submissions.flatMap((s) =>
    (s.feedback || []).map((f) => ({
      ...f,
      deadline_title: s.deadline_title,
    }))
  );

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
        <p>Track your proposal progress, deadlines, file submissions, and guide feedback</p>

        {error && <div className="alert-box alert-error">{error}</div>}
        {success && <div className="alert-box alert-success">{success}</div>}

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
        ) : !project ? (
          <div className="status-details">
            <h3>Team Registered: {team.name}</h3>
            <p>
              Your team has not registered a project proposal yet.{" "}
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
                <b>Team Name:</b> {project.team_name || team.name}
              </p>
              <p>
                <b>Project Title:</b> {project.title}
              </p>
              <p>
                <b>Registered On:</b>{" "}
                {new Date(project.created_at).toLocaleDateString()}
              </p>
              <p>
                <b>Assigned Guide:</b>{" "}
                {project.guide_name || "Awaiting Coordinator Allocation"}
              </p>
              {project.objectives && (
                <p>
                  <b>Objectives:</b> {project.objectives}
                </p>
              )}
              {project.scope && (
                <p>
                  <b>Scope:</b> {project.scope}
                </p>
              )}
            </div>

            <div className="status-box">
              <h3>Proposal Status</h3>
              <span className={getStatusClass(project.status)}>
                {project.status}
              </span>
              <p>{getStatusDescription(project.status)}</p>
            </div>

            <div className="feedback-box">
              <h3>Deadlines &amp; File Upload</h3>
              {deadlines.length === 0 ? (
                <p>No deadlines have been posted yet.</p>
              ) : (
                <>
                  {deadlines.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        padding: "10px 0",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        <b>{d.title}</b>
                        <span className={getDeadlineBadgeClass(d.state)}>
                          {d.state.replace("_", " ")} {d.submitted ? "• Submitted" : ""}
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
                        Due: {new Date(d.due_date).toLocaleString()}
                        {d.description ? ` — ${d.description}` : ""}
                      </div>
                    </div>
                  ))}

                  <form onSubmit={handleUpload} className="upload-form">
                    <h4>Upload Deliverable</h4>
                    <label>Select Deadline</label>
                    <select
                      value={selectedDeadlineId}
                      onChange={(e) => setSelectedDeadlineId(e.target.value)}
                      required
                    >
                      {deadlines.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title} (Due {new Date(d.due_date).toLocaleDateString()})
                        </option>
                      ))}
                    </select>

                    <label>Choose File (PDF, DOC/DOCX, PPT/PPTX, ZIP — max 10 MB)</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      required
                    />

                    <button type="submit" disabled={uploading}>
                      {uploading ? "Uploading File..." : "Upload Submission"}
                    </button>
                  </form>
                </>
              )}
            </div>

            <div className="feedback-box">
              <h3>Submitted Files &amp; Guide Feedback</h3>
              {submissions.length === 0 ? (
                <p>No files uploaded yet.</p>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      padding: "12px",
                      marginBottom: "12px",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      <div>
                        <b>{sub.deadline_title}</b>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          Submitted: {new Date(sub.submitted_at).toLocaleString()}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="download-btn"
                        onClick={() => handleDownload(sub.id)}
                      >
                        Download File
                      </button>
                    </div>

                    {sub.feedback && sub.feedback.length > 0 ? (
                      <div style={{ marginTop: "10px" }}>
                        {sub.feedback.map((fb) => (
                          <div
                            key={fb.id}
                            style={{
                              padding: "8px 10px",
                              marginTop: "6px",
                              background: "#eef2ff",
                              borderRadius: "6px",
                              fontSize: "14px",
                            }}
                          >
                            <b>{fb.guide_name}:</b> {fb.comments}
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              {new Date(fb.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: "13px", color: "#64748b", marginBottom: 0 }}>
                        No guide feedback on this submission yet.
                      </p>
                    )}
                  </div>
                ))
              )}

              {submissions.length > 0 && allFeedback.length === 0 && (
                <p style={{ fontSize: "13px", color: "#64748b" }}>
                  Awaiting guide comments on your uploaded files.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default StudentStatus;
