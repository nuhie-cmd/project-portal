import { useNavigate } from "react-router-dom";

function DashboardLayout({ title, children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="dashboard">
      <header className="topbar">
        <h2>{title}</h2>
        <button onClick={handleLogout}>Logout</button>
      </header>
      <main className="dashboard-content">{children}</main>
    </div>
  );
}

export default DashboardLayout;