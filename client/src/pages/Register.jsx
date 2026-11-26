import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

function Register() {
  const [name, setName] = useState("");
  const [usn, setUsn] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api("/auth/register", {
        method: "POST",
        body: { name, usn, email, password },
      });
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-brand">
          <div className="brand-pill">Student Registration</div>
          <h1>Join Your Mini-Project Team</h1>
          <p className="brand-sub">
            Register with your USN and college email to form a team, submit project
            proposals, and track deadlines with your faculty guide.
          </p>
          <ul className="brand-features">
            <li>Create or join a team of up to 4 students</li>
            <li>Check proposal similarity before submission</li>
            <li>Upload reports and receive guide feedback</li>
          </ul>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <h2>Create student account</h2>
            <p>Guides and coordinators are provisioned by the department</p>
          </div>

          {error && <div className="auth-alert auth-alert-error">{error}</div>}
          {success && <div className="auth-alert auth-alert-ok">{success}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="field-label">
              <span>Full name</span>
              <input
                type="text"
                placeholder="e.g. Mirvaza Musthafa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className="field-label">
              <span>USN</span>
              <input
                type="text"
                placeholder="e.g. 4SF24CI084"
                value={usn}
                onChange={(e) => setUsn(e.target.value)}
                required
              />
            </label>

            <label className="field-label">
              <span>Email address</span>
              <input
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="field-label">
              <span>Password (min 8 characters)</span>
              <div className="password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="toggle-pw"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="auth-footer">
            Already registered? <Link to="/">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
