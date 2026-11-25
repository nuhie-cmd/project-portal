
import "./StudentStatus.css";

function StudentStatus() {
  return (
    <div className="status-page">
      <div className="status-card">
        <h1>Student Project Status</h1>
        <p>Track your project proposal progress</p>

        <div className="status-details">
          <h3>Project Details</h3>
          <p><b>Team Name:</b> AI Innovators</p>
          <p><b>Project Title:</b> Smart Waste Management System</p>
          <p><b>Submission Date:</b> 21-11-2026</p>
          <p><b>Guide Name:</b> Project Guide</p>
        </div>

        <div className="status-box">
          <h3>Proposal Status</h3>
          <span>Pending</span>
          <p>Your proposal is waiting for guide approval.</p>
        </div>

        <div className="feedback-box">
          <h3>Guide Feedback</h3>
          <p>No feedback available yet.</p>
        </div>
      </div>
    </div>
  );
}

export default StudentStatus;
