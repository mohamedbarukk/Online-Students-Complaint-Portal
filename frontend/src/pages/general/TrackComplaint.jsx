// src/pages/TrackComplaint.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./TrackComplaint.css";

export default function TrackComplaint() {
  const [id, setId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const handleTrack = async () => {
    setError("");
    setResult(null);

    if (!id.trim()) {
      setError("Please enter a complaint ID");
      return;
    }

    try {
      const token = user?.token || localStorage.getItem("ocp_token");
      const res = await fetch(
        `http://localhost:5000/api/complaints/${encodeURIComponent(id)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Complaint not found");
      setResult(data.complaint);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error tracking complaint");
    }
  };

  // ===== Timeline Steps =====
  const getTimelineSteps = (complaint) => {
    if (!complaint) return [];

    return [
      {
        label: "Submitted",
        date: new Date(complaint.created_at).toLocaleString(),
        active: true,
      },
      {
        label: "Under Process",
        date:
          complaint.status === "Under Process" || complaint.status === "Resolved"
            ? new Date(complaint.updated_at || complaint.created_at).toLocaleString()
            : null,
        active: complaint.status === "Under Process" || complaint.status === "Resolved",
      },
      {
        label: "Resolved",
        date: complaint.status === "Resolved" ? new Date(complaint.updated_at).toLocaleString() : null,
        active: complaint.status === "Resolved",
        resolved: complaint.status === "Resolved",
      },
    ];
  };

  return (
    <div className="track-complaint">
      <h2>Track Complaint</h2>

      {/* Input + Button */}
      <div className="track-form">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Enter Complaint ID"
        />
        <button onClick={handleTrack}>Track</button>
      </div>

      {/* Error */}
      {error && <div className="error">{error}</div>}

      {/* Result */}
      {result && (
        <div className="status-card">
          <h3>
            {result.title} (#{result.id})
          </h3>
          <div><strong>Category:</strong> {result.category}</div>

          {/* Timeline */}
          <div className="status-timeline">
            {getTimelineSteps(result).map((step, i) => (
              <div
                key={i}
                className={`status-step 
                  ${step.active ? "active" : ""} 
                  ${step.resolved ? "resolved" : ""}`}
              >
                <span>{step.label}</span>
                {step.date && <span className="status-date">{step.date}</span>}
              </div>
            ))}
          </div>

          {/* Attachments */}
          {result.attachments && result.attachments.length > 0 && (
            <div className="attachments-list">
              <strong>Attachments:</strong>
              <ul>
                {result.attachments.map((p, i) => (
                  <li key={i}>
                    <a
                      href={`http://localhost:5000/${p}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      File {i + 1}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
