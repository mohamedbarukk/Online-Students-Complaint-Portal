// modify src/components/TopHeader.jsx (add a button next to logout)
import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./TopHeader.css";

export default function TopHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="top-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div className="left">
        <h3>Welcome, {user?.username || "Student"}</h3>
      </div>

      <div className="right" style={{ display: "flex", gap: 12 }}>
        <button className="btn-link" onClick={() => { logout(); navigate("/login"); }}>Logout</button>
      </div>
    </header>
  );
}
