import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, saveAuth } from "../api";

const roleRoutes = {
  student: "/student",
  guide: "/guide",
  coordinator: "/coordinator",
};

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      saveAuth(data.token, data.user);
      navigate(roleRoutes[data.user.role] || "/");
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
          <div className="brand-pill">Academic Mini-Project Portal</div>
          <h1>Smart Student–Faculty Coordination &amp; Monitoring</h1>
          <p className="brand-sub">
            Centralized project registration, guide allocation, milestone tracking,
            submissions, and AI-powered semantic similarity checks.
          </p>
          <ul className="brand-features">
            <li>Team &amp; proposal management with overlap detection</li>
            <li>Real-time deadlines, milestones &amp; guide feedback</li>
            <li>Automated guide allocation &amp; coordinator reports</li>
          </ul>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <h2>Welcome back</h2>
            <p>Sign in with your institutional account</p>
          </div>

          {error && <div className="auth-alert auth-alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
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
              <span>Password</span>
              <div className="password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="auth-footer">
            New student? <Link to="/register">Create a student account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
