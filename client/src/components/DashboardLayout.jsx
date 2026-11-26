import { NavLink, useNavigate } from "react-router-dom";

const menus = {
  Student: [
    { label: "Dashboard", path: "/student" },
    { label: "Proposal", path: "/proposal" },
    { label: "Schedule", path: "/student/deadlines" },
  ],
  Guide: [
    { label: "Dashboard", path: "/guide" },
    { label: "Schedule", path: "/guide/deadlines" },
  ],
  Coordinator: [
    { label: "Dashboard", path: "/coordinator" },
    { label: "Assign guide", path: "/coordinator/assign" },
    { label: "Schedule", path: "/coordinator/schedule" },
  ],
};

function DashboardLayout({ role = "", children }) {
  const navigate = useNavigate();
  const links = menus[role] || [];

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
            <NavLink
              key={link.path}
              to={link.path}
              end
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </aside>
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;