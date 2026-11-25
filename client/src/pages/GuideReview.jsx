
import { useState } from "react";
import "./GuideReview.css";

function GuideReview() {
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState("Pending");

  return (
    <div className="review-page">
      <div className="review-card">
        <h1>Guide Review</h1>
        <p>Review and approve student project proposals</p>

        <h3>Team Details</h3>
        <p><b>Team Name:</b> AI Innovators</p>
        <p><b>Project Title:</b> Smart Waste Management System</p>

        <h3>Problem Statement</h3>
        <p>Improper waste disposal causes pollution and health problems.</p>

        <h3>Objectives</h3>
        <p>To identify and classify different types of waste using AI.</p>

        <h3>Technologies Used</h3>
        <p>Python, Machine Learning, OpenCV, TensorFlow</p>

        <h3>Guide Feedback</h3>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Enter your feedback"
        />

        <h3>Proposal Status: {status}</h3>

        <button className="approve-btn"
          onClick={() => setStatus("Approved")}>
          Approve
        </button>

        <button className="reject-btn"
          onClick={() => setStatus("Rejected")}>
          Reject
        </button>
      </div>
    </div>
  );
}

export default GuideReview;
