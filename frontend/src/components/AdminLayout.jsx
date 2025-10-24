import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import "./AdminLayout.css";

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      {/* 📂 Sidebar Section */}
      <aside className="admin-sidebar-section">
        <AdminSidebar />
      </aside>

      {/* 🧭 Main Section */}
      <div className="admin-main">
        {/* Header (Top Navigation) */}
        <header className="admin-top-header">
          <AdminHeader />
        </header>

        {/* Page Content Area */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
