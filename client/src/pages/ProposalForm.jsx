
import { useState } from "react";
import "./ProposalForm.css";

function ProposalForm() {
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [objectives, setObjectives] = useState("");
  const [technology, setTechnology] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ title, problem, objectives, technology, description });
    alert("Project proposal submitted successfully!");
  };

  return (
    <div className="proposal-page">
      <div className="proposal-card">
        <h1>Project Proposal</h1>
        <p>Submit your project idea for guide approval</p>

        <form onSubmit={handleSubmit}>
          <label>Project Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Enter project title" required />

          <label>Problem Statement</label>
          <textarea value={problem} onChange={e => setProblem(e.target.value)}
            placeholder="Describe the problem" required />

          <label>Objectives</label>
          <textarea value={objectives} onChange={e => setObjectives(e.target.value)}
            placeholder="Enter project objectives" required />

          <label>Technologies Used</label>
          <input value={technology} onChange={e => setTechnology(e.target.value)}
            placeholder="Example: Python, React, MySQL" required />

          <label>Project Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Explain your project" required />

          <button type="submit">Submit Proposal</button>
        </form>
      </div>
    </div>
  );
}

export default ProposalForm;
