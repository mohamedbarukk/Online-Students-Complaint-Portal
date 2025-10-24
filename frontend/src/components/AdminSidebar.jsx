import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderOpen, FileBarChart, LogOut } from "lucide-react";
import "./AdminSidebar.css";

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: "Dashboard", path: "/admin", icon: <LayoutDashboard size={18} /> },
    { name: "All Complaints", path: "/admin/complaints", icon: <FolderOpen size={18} /> },
    { name: "Reports & Exports", path: "/admin/reports", icon: <FileBarChart size={18} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("ocp_token");
    localStorage.removeItem("ocp_role");
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Admin Portal</h2>
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
