import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

const links = ["Dashboard", "My team", "Proposal", "Feedback", "Deadlines"];
const THRESHOLD = 0.5;

function Proposal() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMatches(null);
    try {
      const res = await fetch("http://localhost:5001/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      setMatches(data.matches);
    } catch (err) {
      setError("Could not reach the similarity service. Is it running?");
    }
    setLoading(false);
  };

  const flagged = matches && matches.some((m) => m.score >= THRESHOLD);
  const canSubmit = title.trim() && description.trim() && !loading;

  return (
    <DashboardLayout role="Student" links={links} active="Proposal">
      <h2>Submit proposal</h2>
      <p className="proposal-intro">
        Describe your project idea. Before it goes to your guide, we compare it
        with existing projects to spot possible overlap.
      </p>

      <form className="proposal-form" onSubmit={handleSubmit}>
        <label>
          Project title
          <input
            type="text"
            placeholder="e.g. Predicting food wastage in college canteens"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Problem statement and description
          <textarea
            rows="6"
            placeholder="What problem does it solve, for whom, and how?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <button type="submit" disabled={!canSubmit}>
          {loading ? "Checking for similar projects..." : "Submit proposal"}
        </button>
      </form>

      {error && <div className="alert alert-warning">{error}</div>}

      {matches && (
        <div className={flagged ? "alert alert-warning" : "alert alert-ok"}>
          <strong className="alert-title">
            {flagged
              ? "Similar projects found. Please review them before continuing."
              : "No close matches found. Your idea looks distinct."}
          </strong>

          {matches.map((m) => (
            <div className="match-card" key={m.id}>
              <div className="match-head">
                <span>{m.title}</span>
                {m.score >= THRESHOLD && (
                  <span className="match-tag">Possible overlap</span>
                )}
              </div>
              <div className="score-track">
                <div
                  className={
                    m.score >= THRESHOLD ? "score-fill high" : "score-fill"
                  }
                  style={{ width: `${Math.max(m.score, 0) * 100}%` }}
                />
              </div>
              <div className="score-label">
                Similarity: {(m.score * 100).toFixed(0)}%
              </div>
            </div>
          ))}

          <p className="alert-note">
            Scores are indicators for review, not proof of duplication. The
            coordinator makes the final decision.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Proposal;