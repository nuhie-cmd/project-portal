
import "./GuideTeamList.css";

function GuideTeamList() {
  const teams = [
    {
      name: "AI Innovators",
      project: "Smart Waste Management System",
      leader: "Gagan",
      members: 4,
      status: "Pending"
    },
    {
      name: "Tech Warriors",
      project: "Fake News Detection",
      leader: "Rahul",
      members: 3,
      status: "Approved"
    },
    {
      name: "Code Masters",
      project: "Student Management System",
      leader: "Priya",
      members: 4,
      status: "Pending"
    }
  ];

  return (
    <div className="guide-list-page">
      <div className="guide-list-card">
        <h1>Guide Team List</h1>
        <p>View all registered project teams</p>

        <h3>Total Teams: {teams.length}</h3>

        {teams.map((team, index) => (
          <div className="guide-team" key={index}>
            <h2>{team.name}</h2>
            <p><b>Project:</b> {team.project}</p>
            <p><b>Team Leader:</b> {team.leader}</p>
            <p><b>Members:</b> {team.members}</p>
            <p><b>Status:</b> {team.status}</p>
            <button onClick={() =>
              alert("Viewing proposal: " + team.project)
            }>
              View Proposal
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GuideTeamList;
