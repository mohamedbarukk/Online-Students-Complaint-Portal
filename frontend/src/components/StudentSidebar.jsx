import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FilePlus2, List, User, LogOut } from "lucide-react";
import "./StudentSidebar.css";

export default function StudentSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: "Dashboard", path: "/student", icon: <LayoutDashboard size={18} /> },
    { name: "Submit Complaint", path: "/student/submit", icon: <FilePlus2 size={18} /> },
    { name: "My Complaints", path: "/student/my-complaints", icon: <List size={18} /> },
    { name: "Profile", path: "/student/profile", icon: <User size={18} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("ocp_token");
    localStorage.removeItem("ocp_role");
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Student Portal</h2>
      </div>

      <ul className="sidebar-menu">
        {navItems.map((item) => (
          <li
            key={item.path}
            className={location.pathname === item.path ? "active" : ""}
          >
            <Link to={item.path}>
              {item.icon}
              <span>{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="sidebar-bottom">
        <button onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
