import React from "react";
import { Outlet } from "react-router-dom";
import StudentSidebar from "./StudentSidebar";
import StudentHeader from "./StudentHeader";
import "./StudentLayout.css";

export default function StudentLayout() {
  return (
    <div className="student-layout">
      {/* Sidebar */}
      <aside className="student-sidebar-section">
        <StudentSidebar />
      </aside>

      {/* Main Section */}
      <div className="student-main">
        <header className="student-top-header">
          <StudentHeader />
        </header>

        <main className="student-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
