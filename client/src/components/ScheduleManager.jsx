import { useState } from "react";
import { useSchedule } from "../context/DeadlinesContext";
import { ALL_TEAMS } from "../data/demoTeams";

function ScheduleManager({ role, teamIds, allowAll }) {
  const { events, addEvent, removeEvent } = useSchedule();
  const myTeams = ALL_TEAMS.filter((t) => teamIds.includes(t.id));

  const [type, setType] = useState("Deadline");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [target, setTarget] = useState(allowAll ? "all" : String(myTeams[0].id));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !date) return;
    addEvent({
      type,
      title,
      date,
      teamId: target === "all" ? "all" : Number(target),
      by: role,
    });
    setTitle("");
    setDate("");
  };

  const teamName = (id) =>
    id === "all" ? "All teams" : ALL_TEAMS.find((t) => t.id === id)?.name;

  const visible = events
    .filter((e) => allowAll || e.teamId === "all" || teamIds.includes(e.teamId))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <form className="inline-form" onSubmit={handleSubmit}>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>Deadline</option>
          <option>Presentation</option>
        </select>
        <input
          type="text"
          placeholder="Title (e.g. Review 2)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          {allowAll && <option value="all">All teams</option>}
          {myTeams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button type="submit">Schedule</button>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Title</th>
            <th>Date</th>
            <th>For</th>
            <th>Set by</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visible.map((e) => (
            <tr key={e.id}>
              <td>{e.type}</td>
              <td>{e.title}</td>
              <td>{e.date}</td>
              <td>{teamName(e.teamId)}</td>
              <td>{e.by}</td>
              <td>
                {allowAll || e.by === role ? (
                  <button className="link-button" onClick={() => removeEvent(e.id)}>
                    Remove
                  </button>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default ScheduleManager;