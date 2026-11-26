import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const demoUsers = [
  { email: "student@demo.com", password: "demo123", path: "/student" },
  { email: "guide@demo.com", password: "demo123", path: "/guide" },
  { email: "coordinator@demo.com", password: "demo123", path: "/coordinator" },
];

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = demoUsers.find(
      (u) => u.email === email && u.password === password
    );
    if (user) {
      navigate(user.path);
    } else {
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="auth-card">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      <p>
        New team? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}

export default Login;