import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, getAuthUser } from "../api";
import "./TeamRegistration.css";

function TeamRegistration() {
  const user = getAuthUser();
  const [teamName, setTeamName] = useState("");
  const [memberUsns, setMemberUsns] = useState([""]);
  const [newUsn, setNewUsn] = useState("");

  const [existingTeam, setExistingTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [warning, setWarning] = useState("");

  const refreshTeam = async () => {
    const res = await apiRequest("/teams/mine");
    setExistingTeam(res.team || null);
    return res.team || null;
  };

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await apiRequest("/teams/mine");
        if (active) setExistingTeam(res.team || null);
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

  const addUsnRow = () => {
    if (memberUsns.length < 3) {
      setMemberUsns([...memberUsns, ""]);
    }
  };

  const updateUsnRow = (index, value) => {
    setMemberUsns(memberUsns.map((u, i) => (i === index ? value : u)));
  };

  const removeUsnRow = (index) => {
    setMemberUsns(memberUsns.filter((_, i) => i !== index));
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setWarning("");

    if (!teamName.trim()) {
      setError("Team name is required.");
      return;
    }

    const cleanedUsns = memberUsns
      .map((u) => u.trim().toUpperCase())
      .filter(Boolean);

    if (cleanedUsns.length > 3) {
      setError("A team can have at most 4 members including the team leader.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await apiRequest("/teams", {
        method: "POST",
        body: JSON.stringify({ name: teamName.trim() }),
      });

      const failedMembers = [];
      for (const usn of cleanedUsns) {
        try {
          await apiRequest(`/teams/${created.id}/members`, {
            method: "POST",
            body: JSON.stringify({ usn }),
          });
        } catch (memberErr) {
          failedMembers.push(`${usn}: ${memberErr.message}`);
        }
      }

      await refreshTeam();
      setSuccess(`Team "${created.name}" created successfully!`);
      if (failedMembers.length > 0) {
        setWarning(
          `Team created, but some members could not be added (${failedMembers.join("; ")}). You can add them below.`
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setWarning("");

    const usn = newUsn.trim().toUpperCase();
    if (!usn) {
      setError("Please enter the student's USN.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest(`/teams/${existingTeam.id}/members`, {
        method: "POST",
        body: JSON.stringify({ usn }),
      });
      await refreshTeam();
      setNewUsn("");
      setSuccess(res.message || "Member added to the team.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isLeader = existingTeam && existingTeam.leader_id === user?.id;
  const memberCount = existingTeam?.members?.length || 0;

  return (
    <div className="team-page">
      <div className="team-card">
        <div className="page-nav">
          <Link className="back-link" to="/student">
            &larr; Back to Dashboard
          </Link>
          <Link className="back-link" to="/proposal">
            Project Proposal &rarr;
          </Link>
        </div>

        <h1>Team Registration</h1>
        <p className="team-subtitle">
          Register your team and add members by their registered USN (max 4 members)
        </p>

        {error && <div className="alert-box alert-error">{error}</div>}
        {warning && <div className="alert-box alert-info">{warning}</div>}
        {success && <div className="alert-box alert-success">{success}</div>}

        {loading ? (
          <p>Loading team information...</p>
        ) : existingTeam ? (
          <div>
            <div className="alert-box alert-info">
              <b>Team Name:</b> {existingTeam.name} &bull; <b>Members:</b>{" "}
              {memberCount} / 4
            </div>

            <h3>Team Members</h3>
            {(existingTeam.members || []).map((m) => (
              <div className="member-box" key={m.id}>
                <h4>
                  {m.name}{" "}
                  {m.id === existingTeam.leader_id ? "(Team Leader)" : "(Member)"}
                </h4>
                <p style={{ margin: "4px 0" }}>
                  <b>USN:</b> {m.usn || "N/A"}
                </p>
              </div>
            ))}

            {isLeader && memberCount < 4 && (
              <form onSubmit={handleAddMember}>
                <h3>Add Team Member by USN</h3>
                <input
                  type="text"
                  placeholder="Enter student USN (e.g. 4SF24CI002)"
                  value={newUsn}
                  onChange={(e) => setNewUsn(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="add-btn"
                  style={{ marginTop: "12px" }}
                  disabled={submitting}
                >
                  {submitting ? "Adding Member..." : "+ Add Member"}
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
          <form onSubmit={handleCreateTeam}>
            <div className="alert-box alert-info">
              You ({user?.name}) will be registered as the <b>Team Leader</b>.
              Teammates must already have a Student account so they can be added by USN.
            </div>

            <label>Team Name</label>
            <input
              type="text"
              placeholder="Enter team name (e.g. Team Alpha)"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />

            <h3>Add Teammates by USN (Optional, max 3)</h3>
            {memberUsns.map((usnVal, index) => (
              <div className="member-box" key={index}>
                <h4>Member {index + 1}</h4>
                <input
                  type="text"
                  placeholder="Enter teammate USN (optional)"
                  value={usnVal}
                  onChange={(e) => updateUsnRow(index, e.target.value)}
                />
                {memberUsns.length > 1 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeUsnRow(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            {memberUsns.length < 3 && (
              <button type="button" className="add-btn" onClick={addUsnRow}>
                + Add Another USN Field
              </button>
            )}

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
