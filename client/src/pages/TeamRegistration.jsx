import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, getAuthUser } from "../api";
import "./TeamRegistration.css";

function TeamRegistration() {
  const user = getAuthUser();
  const [team, setTeam] = useState("");
  const [project, setProject] = useState("");
  const [guideId, setGuideId] = useState("");
  const [guides, setGuides] = useState([]);
  const [leader, setLeader] = useState({
    name: user?.name || "",
    usn: user?.usn || "",
    email: user?.email || "",
  });
  const [members, setMembers] = useState([{ name: "", usn: "", email: "" }]);

  const [existingTeam, setExistingTeam] = useState(null);
  const [newMember, setNewMember] = useState({ name: "", usn: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [teamRes, guidesRes] = await Promise.all([
          apiRequest("/teams/my"),
          apiRequest("/auth/guides"),
        ]);
        if (active) {
          setExistingTeam(teamRes.team || null);
          setGuides(guidesRes.guides || []);
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

  const addMember = () => {
    setMembers([...members, { name: "", usn: "", email: "" }]);
  };

  const updateMember = (index, field, value) => {
    const updated = members.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setMembers(updated);
  };

  const removeMember = (index) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!team.trim() || !project.trim()) {
      setError("Team name and project title are required.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiRequest("/teams", {
        method: "POST",
        body: JSON.stringify({
          teamName: team.trim(),
          projectTitle: project.trim(),
          guideId: guideId ? Number(guideId) : null,
          leader: {
            name: leader.name.trim(),
            usn: leader.usn.trim(),
            email: leader.email.trim(),
          },
          members: members.map((m) => ({
            name: m.name.trim(),
            usn: m.usn.trim(),
            email: m.email.trim(),
          })),
        }),
      });

      setExistingTeam(data.team);
      setSuccess("Team registered successfully! You can now submit your project proposal.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSingleMember = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const data = await apiRequest(`/teams/${existingTeam.id}/members`, {
        method: "POST",
        body: JSON.stringify({
          name: newMember.name.trim(),
          usn: newMember.usn.trim(),
          email: newMember.email.trim(),
        }),
      });
      setExistingTeam(data.team);
      setNewMember({ name: "", usn: "", email: "" });
      setSuccess("Team member added successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="team-page">
      <div className="team-card">
        <div className="page-nav">
          <Link className="back-link" to="/student">
            &larr; Back to Dashboard
          </Link>
          <Link className="back-link" to="/proposal">
            Submit Proposal &rarr;
          </Link>
        </div>

        <h1>Team Registration</h1>
        <p className="team-subtitle">Register your project team</p>

        {error && <div className="alert-box alert-error">{error}</div>}
        {success && <div className="alert-box alert-success">{success}</div>}

        {loading ? (
          <p>Loading team information...</p>
        ) : existingTeam ? (
          <div>
            <div className="alert-box alert-info">
              Your team <b>{existingTeam.team_name}</b> is registered for{" "}
              <b>{existingTeam.project_title}</b>.
              {existingTeam.guide_name
                ? ` Assigned Guide: ${existingTeam.guide_name}.`
                : " Guide: Awaiting guide assignment."}
            </div>

            <h3>Registered Members ({existingTeam.members?.length || 0})</h3>
            {(existingTeam.members || []).map((m) => (
              <div className="member-box" key={m.id}>
                <h4>
                  {m.member_name}{" "}
                  {m.role_in_team === "leader" ? "(Team Leader)" : "(Member)"}
                </h4>
                <p style={{ margin: "4px 0" }}>
                  <b>USN:</b> {m.member_usn}
                </p>
                <p style={{ margin: "4px 0" }}>
                  <b>Email:</b> {m.member_email}
                </p>
              </div>
            ))}

            {existingTeam.leader_user_id === user?.id && (
              <form onSubmit={handleAddSingleMember}>
                <h3>Add Another Member</h3>
                <input
                  type="text"
                  placeholder="Member name"
                  value={newMember.name}
                  onChange={(e) =>
                    setNewMember({ ...newMember, name: e.target.value })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Member USN"
                  style={{ marginTop: "10px" }}
                  value={newMember.usn}
                  onChange={(e) =>
                    setNewMember({ ...newMember, usn: e.target.value })
                  }
                  required
                />
                <input
                  type="email"
                  placeholder="Member email"
                  style={{ marginTop: "10px" }}
                  value={newMember.email}
                  onChange={(e) =>
                    setNewMember({ ...newMember, email: e.target.value })
                  }
                  required
                />
                <button
                  type="submit"
                  className="add-btn"
                  style={{ marginTop: "12px" }}
                  disabled={submitting}
                >
                  {submitting ? "Adding Member..." : "+ Add Member to Team"}
                </button>
              </form>
            )}

            <Link
              to="/proposal"
              className="team-submit"
              style={{ display: "block", textAlign: "center", textDecoration: "none" }}
            >
              Proceed to Project Proposal
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>Team Name</label>
            <input
              type="text"
              placeholder="Enter team name"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              required
            />

            <label>Project Title</label>
            <input
              type="text"
              placeholder="Enter project title"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              required
            />

            {guides.length > 0 && (
              <>
                <label>Preferred Guide (Optional)</label>
                <select
                  value={guideId}
                  onChange={(e) => setGuideId(e.target.value)}
                >
                  <option value="">Any Available Guide</option>
                  {guides.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.email})
                    </option>
                  ))}
                </select>
              </>
            )}

            <h3>Team Leader Details</h3>

            <label>Leader Name</label>
            <input
              type="text"
              placeholder="Enter leader name"
              value={leader.name}
              onChange={(e) => setLeader({ ...leader, name: e.target.value })}
              required
            />

            <label>Leader USN</label>
            <input
              type="text"
              placeholder="Enter USN"
              value={leader.usn}
              onChange={(e) => setLeader({ ...leader, usn: e.target.value })}
              required
            />

            <label>Leader Email</label>
            <input
              type="email"
              placeholder="Enter email"
              value={leader.email}
              onChange={(e) => setLeader({ ...leader, email: e.target.value })}
              required
            />

            <h3>Team Members</h3>

            {members.map((member, index) => (
              <div className="member-box" key={index}>
                <h4>Member {index + 1}</h4>

                <input
                  type="text"
                  placeholder="Member name"
                  value={member.name}
                  onChange={(e) => updateMember(index, "name", e.target.value)}
                  required
                />

                <input
                  type="text"
                  placeholder="Member USN"
                  value={member.usn}
                  onChange={(e) => updateMember(index, "usn", e.target.value)}
                  required
                />

                <input
                  type="email"
                  placeholder="Member email"
                  value={member.email}
                  onChange={(e) => updateMember(index, "email", e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeMember(index)}
                >
                  Remove Member
                </button>
              </div>
            ))}

            <button type="button" className="add-btn" onClick={addMember}>
              + Add Member
            </button>

            <button type="submit" className="team-submit" disabled={submitting}>
              {submitting ? "Registering Team..." : "Register Team"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default TeamRegistration;
