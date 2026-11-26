import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

const MAX_TEAMS = 4;

const guides = [
  { id: 1, name: "Guide A", domains: ["NLP", "ML"],
    expertise: "natural language processing, machine learning, deep learning" },
  { id: 2, name: "Guide B", domains: ["Web", "Data"],
    expertise: "web development, databases, cloud computing" },
  { id: 3, name: "Guide C", domains: ["IoT", "Networks", "CV"],
    expertise: "computer vision, IoT, embedded systems, sensors, networks" },
];

const teams = [
  { id: 1, name: "Team 1", domain: "NLP", title: "Sentiment analysis of feedback",
    description: "Classify course feedback using NLP." },
  { id: 2, name: "Team 2", domain: "NLP", title: "Chatbot for college queries",
    description: "Answer student questions using language models." },
  { id: 3, name: "Team 3", domain: "NLP", title: "Fake news detection",
    description: "Classify news text as real or fake." },
  { id: 4, name: "Team 4", domain: "NLP", title: "Resume screening",
    description: "Rank resumes against job descriptions using text embeddings." },
  { id: 5, name: "Team 5", domain: "NLP", title: "Text summarizer",
    description: "Summarize long documents using transformers." },
  { id: 6, name: "Team 6", domain: "IoT", title: "Smart parking",
    description: "Detect free parking spots with sensors." },
  { id: 7, name: "Team 7", domain: "Web", title: "Event portal",
    description: "Web app with a database for event registration." },
];

function CoordinatorAssign() {
  const [allocation, setAllocation] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loads = {};
  guides.forEach((g) => (loads[g.id] = 0));
  Object.values(allocation).forEach((a) => {
    loads[a.guide_id] += 1;
  });

  const autoAllocate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5001/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teams, guides, max_teams: MAX_TEAMS }),
      });
      const data = await res.json();
      const next = {};
      data.allocations.forEach((a) => {
        next[a.team_id] = a;
      });
      setAllocation(next);
    } catch (err) {
      setError("Could not reach the AI service. Is it running?");
    }
    setLoading(false);
  };

  const changeGuide = (team, guideId) => {
    setAllocation((prev) => {
      const next = { ...prev };
      if (!guideId) {
        delete next[team.id];
        return next;
      }
      const guide = guides.find((g) => g.id === Number(guideId));
      next[team.id] = {
        team_id: team.id,
        guide_id: guide.id,
        guide_name: guide.name,
        score: null,
        domain_match: guide.domains.includes(team.domain),
      };
      return next;
    });
  };

  return (
    <DashboardLayout role="Coordinator">
      <h2>Assign guides</h2>

      <div className="stat-grid">
        {guides.map((g) => (
          <div className="stat-card" key={g.id}>
            <div className="stat-number">
              {loads[g.id]}/{MAX_TEAMS}
            </div>
            <div className="stat-label">
              {g.name} ({g.domains.join(", ")})
            </div>
          </div>
        ))}
      </div>

      <div className="inline-form">
        <button onClick={autoAllocate} disabled={loading}>
          {loading ? "Allocating..." : "Auto-allocate with AI"}
        </button>
      </div>

      {error && <div className="alert alert-warning">{error}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>Project</th>
            <th>Domain</th>
            <th>Guide</th>
            <th>Fit</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => {
            const a = allocation[team.id];
            return (
              <tr key={team.id}>
                <td>{team.name}</td>
                <td>{team.title}</td>
                <td>{team.domain}</td>
                <td>
                  <select
                    value={a ? a.guide_id : ""}
                    onChange={(e) => changeGuide(team, e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {guides.map((g) => (
                      <option
                        key={g.id}
                        value={g.id}
                        disabled={
                          loads[g.id] >= MAX_TEAMS && !(a && a.guide_id === g.id)
                        }
                      >
                        {g.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  {a &&
                    (a.domain_match ? (
                      <span className="status-badge">Domain match</span>
                    ) : (
                      <span className="status-badge waiting">Low fit, review</span>
                    ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p>
        The AI proposes an allocation using domain match and semantic similarity,
        with at most {MAX_TEAMS} teams per guide. The coordinator can override it.
      </p>
    </DashboardLayout>
  );
}

export default CoordinatorAssign;