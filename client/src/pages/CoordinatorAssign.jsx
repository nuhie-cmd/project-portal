import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "../api";

const MAX_TEAMS = 4;

function CoordinatorAssign() {
  const [projects, setProjects] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const loadAll = async () => {
    try {
      const [pRes, gRes] = await Promise.all([
        api("/projects"),
        api("/users/guides"),
      ]);
      setProjects(pRes.projects || []);
      setGuides(gRes.guides || []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const changeGuide = async (projectId, guideId) => {
    if (!guideId) return;
    setError("");
    setMsg("");
    try {
      const res = await api(`/projects/${projectId}/guide`, {
        method: "PUT",
        body: { guideId: Number(guideId) },
      });
      setMsg(res.message);
      loadAll();
    } catch (e) {
      setError(e.message);
    }
  };

  const autoAllocate = async () => {
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const unassigned = projects.filter((p) => !p.guide_id);
      if (unassigned.length === 0) {
        setMsg("All projects already have a guide assigned.");
        setLoading(false);
        return;
      }
      const res = await fetch("http://localhost:5001/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teams: unassigned.map((p) => ({
            id: p.id,
            name: p.team_name,
            title: p.title,
            description: p.title,
          })),
          guides: guides.map((g) => ({
            id: g.id,
            name: g.name,
            expertise: "software engineering, machine learning, web development",
          })),
          max_teams: MAX_TEAMS,
        }),
      });
      const data = await res.json();
      for (const a of data.allocations || []) {
        await api(`/projects/${a.team_id}/guide`, {
          method: "PUT",
          body: { guideId: a.guide_id },
        });
      }
      setMsg("AI allocation applied.");
      loadAll();
    } catch (err) {
      setError("Could not reach the AI service or save allocation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="Coordinator">
      <h2>Assign guides</h2>
      {error && <div className="alert alert-warning" style={{ marginBottom: 16 }}>{error}</div>}
      {msg && <div className="alert alert-ok" style={{ marginBottom: 16 }}>{msg}</div>}

      <div className="stat-grid">
        {guides.map((g) => (
          <div className="stat-card" key={g.id}>
            <div className="stat-number">
              {g.allocated}/{g.max_teams}
            </div>
            <div className="stat-label">{g.name}</div>
          </div>
        ))}
      </div>

      <div className="inline-form">
        <button onClick={autoAllocate} disabled={loading}>
          {loading ? "Allocating..." : "Auto-allocate Unassigned with AI"}
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>Project</th>
            <th>Members</th>
            <th>Status</th>
            <th>Assigned Guide</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>{p.team_name}</td>
              <td>{p.title}</td>
              <td>{p.member_count}</td>
              <td>{p.status}</td>
              <td>
                <select
                  value={p.guide_id || ""}
                  onChange={(e) => changeGuide(p.id, e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {guides.map((g) => (
                    <option
                      key={g.id}
                      value={g.id}
                      disabled={g.allocated >= g.max_teams && p.guide_id !== g.id}
                    >
                      {g.name} ({g.allocated}/{g.max_teams})
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardLayout>
  );
}

export default CoordinatorAssign;
