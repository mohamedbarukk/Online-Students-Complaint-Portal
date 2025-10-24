import React from "react";
import "./StudentHeader.css";

export default function StudentHeader() {
  const studentName = localStorage.getItem("username") || "Student";

  return (
    <div className="student-header">
      <h3>Welcome, {studentName}</h3>
    </div>
  );
}
