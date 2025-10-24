import React from "react";
import "./StudentHome.css";
import { useNavigate } from "react-router-dom";

const StudentHome = () => {
  const navigate = useNavigate();

  return (
    <div className="student-home">
      <div className="student-home-content">
        <h1>Welcome to the Student Grievance Portal</h1>
        <p>
          Submit, track, and manage your grievances easily. Stay informed about
          your complaint status in real-time.
        </p>

        <div className="student-home-buttons">
          <button onClick={() => navigate("/complaint-form")}>Submit Complaint</button>
          <button onClick={() => navigate("/student-complaints")}>View Complaints</button>
        </div>
      </div>
    </div>
  );
};

export default StudentHome;
