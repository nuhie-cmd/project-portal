import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "../api";

function Proposal() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState("");
  const [scope, setScope] = useState("");
  const [matches, setMatches] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const navigate = useNavigate();

  const handleCheck = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMatches(null);
    setRecommendation(null);
    try {
      const data = await api("/similarity/check", {
        method: "POST",
        body: { title, description },
      });
      setMatches(data.matches || []);
      setRecommendation(data.recommendation || null);
    } catch (err) {
      setError(err.message || "Could not reach the similarity service.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterProject = async () => {
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      await api("/projects", {
        method: "POST",
        body: { title, description, objectives, scope },
      });
      setSavedMsg("Project registered! Redirecting to dashboard...");
      setTimeout(() => navigate("/student"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const flagged = matches && matches.length > 0;
  const canSubmit = title.trim() && description.trim() && !loading;

  return (
    <DashboardLayout role="Student">
      <h2>Submit proposal</h2>
      <p className="proposal-intro">
        Describe your project idea. Before registering it, the AI checks similarity
        against current and previous projects and suggests whether to change or proceed.
      </p>

      <form className="proposal-form" onSubmit={handleCheck}>
        <label>
          Project title
          <input
            type="text"
            placeholder="e.g. Predicting food wastage in college canteens"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label>
          Problem statement and description
          <textarea
            rows="4"
            placeholder="What problem does it solve, for whom, and how?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>
        <label>
          Objectives
          <textarea
            rows="2"
            placeholder="Key measurable objectives"
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
          />
        </label>
        <label>
          Scope
          <textarea
            rows="2"
            placeholder="Project boundaries and limitations"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          />
        </label>
        <button type="submit" disabled={!canSubmit}>
          {loading ? "Checking for similar projects..." : "Check similarity"}
        </button>
        <button
          type="button"
          disabled={!canSubmit || saving}
          onClick={handleRegisterProject}
          style={{ background: "#16a34a" }}
        >
          {saving ? "Registering..." : "Register Project"}
        </button>
      </form>

      {error && <div className="alert alert-warning" style={{ marginBottom: 16 }}>{error}</div>}
      {savedMsg && <div className="alert alert-ok" style={{ marginBottom: 16 }}>{savedMsg}</div>}

      {matches && (
        <div className={flagged ? "alert alert-warning" : "alert alert-ok"}>
          <strong className="alert-title">
            {recommendation
              ? `${recommendation.label}: ${recommendation.message}`
              : flagged
                ? "Similar projects found. Please review them before continuing."
                : "No similar projects found. Your idea looks distinct — you can proceed."}
          </strong>

          {matches.length > 0 && matches.map((m) => (
            <div className="match-card" key={m.id}>
              <div className="match-head">
                <span>{m.title}</span>
                <span className="match-tag">
                  {m.level === "high" ? "High overlap — consider changing" : "Moderate overlap"}
                </span>
              </div>
              <div className="score-track">
                <div
                  className="score-fill high"
                  style={{ width: `${Math.max(m.score, 0) * 100}%` }}
                />
              </div>
              <div className="score-label">
                Similarity: {m.percent ?? (m.score * 100).toFixed(0)}%
              </div>
            </div>
          ))}

          {matches.length > 0 && (
            <p className="alert-note">
              Scores are indicators for review, not proof of duplication. You can
              revise your topic or proceed if your scope is distinct.
            </p>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

export default Proposal;
