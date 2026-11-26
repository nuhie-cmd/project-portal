import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { dummyUsers } from "../data/dummyData";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = dummyUsers.find(
      (u) => u.email === email.trim() && u.password === password
    );
    if (!user) {
      setError("Incorrect email or password.");
      return;
    }
    setError("");
    navigate("/" + user.role);
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
        {error && <p className="auth-error">{error}</p>}
        <button type="submit">Login</button>
      </form>
      <p>
        New team? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}

export default Login;