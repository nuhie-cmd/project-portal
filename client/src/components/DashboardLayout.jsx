import { Link, useNavigate } from "react-router-dom";
import { clearAuth, getAuthUser, getDashboardPath } from "../api";

function DashboardLayout({ title, children }) {
  const navigate = useNavigate();
  const user = getAuthUser();

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="topbar-left">
          <h2>{title}</h2>
          {user && (
            <span className="user-badge">
              {user.name} ({user.role})
            </span>
          )}
        </div>
        <div className="topbar-actions">
          {user && (
            <Link className="topbar-link" to={getDashboardPath(user.role)}>
              Dashboard
            </Link>
          )}
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <main className="dashboard-content">{children}</main>
    </div>
  );
}

export default DashboardLayout;
