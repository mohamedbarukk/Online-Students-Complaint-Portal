import React from "react";
import "./AdminHeader.css";

export default function AdminHeader() {
  const storedUser = localStorage.getItem("user");
  let adminName = "Admin";

  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      adminName = user.username || "Admin";
    } catch (err) {
      console.error("Error parsing user info:", err);
    }
  }

  return (
    <header className="admin-header">
      <h3 className="welcome-text">Welcome, {adminName}</h3>
    </header>
  );
}
