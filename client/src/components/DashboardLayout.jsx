import { useNavigate } from "react-router-dom";

function DashboardLayout({ role = "", links = [], active = "", children }) {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <header className="topbar">
        <h2>Project Portal</h2>
        <div className="topbar-right">
          <span>{role}</span>
          <button onClick={() => navigate("/")}>Logout</button>
        </div>
      </header>
      <div className="dashboard-body">
        <aside className="sidebar">
          {links.map((link) => (
            <div
              key={link}
              className={link === active ? "sidebar-link active" : "sidebar-link"}
            >
              {link}
            </div>
          ))}
        </aside>
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;