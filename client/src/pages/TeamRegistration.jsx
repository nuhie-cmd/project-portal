
import { useState } from "react";
import "./TeamRegistration.css";

function TeamRegistration() {
  const [team, setTeam] = useState("");
  const [project, setProject] = useState("");
  const [leader, setLeader] = useState({
    name: "",
    usn: "",
    email: ""
  });

  const [members, setMembers] = useState([
    { name: "", usn: "", email: "" }
  ]);

  const addMember = () => {
    setMembers([...members, { name: "", usn: "", email: "" }]);
  };

  const updateMember = (index, field, value) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const removeMember = (index) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log({ team, project, leader, members });
    alert("Team registration submitted successfully!");
  };

  return (
    <div className="team-page">
      <div className="team-card">

        <h1>Team Registration</h1>
        <p className="team-subtitle">
          Register your project team
        </p>

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

          <h3>Team Leader Details</h3>

          <label>Leader Name</label>
          <input
            type="text"
            placeholder="Enter leader name"
            value={leader.name}
            onChange={(e) =>
              setLeader({ ...leader, name: e.target.value })
            }
            required
          />

          <label>Leader USN</label>
          <input
            type="text"
            placeholder="Enter USN"
            value={leader.usn}
            onChange={(e) =>
              setLeader({ ...leader, usn: e.target.value })
            }
            required
          />

          <label>Leader Email</label>
          <input
            type="email"
            placeholder="Enter email"
            value={leader.email}
            onChange={(e) =>
              setLeader({ ...leader, email: e.target.value })
            }
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
                onChange={(e) =>
                  updateMember(index, "name", e.target.value)
                }
                required
              />

              <input
                type="text"
                placeholder="Member USN"
                value={member.usn}
                onChange={(e) =>
                  updateMember(index, "usn", e.target.value)
                }
                required
              />

              <input
                type="email"
                placeholder="Member email"
                value={member.email}
                onChange={(e) =>
                  updateMember(index, "email", e.target.value)
                }
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

          <button
            type="button"
            className="add-btn"
            onClick={addMember}
          >
            + Add Member
          </button>

          <button type="submit" className="team-submit">
            Register Team
          </button>

        </form>
      </div>
    </div>
  );
}

export default TeamRegistration;
