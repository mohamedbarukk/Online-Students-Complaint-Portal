// src/pages/student/StudentComplaint/StudentComplaints.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./StudentComplaints.css";

export default function StudentComplaints() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // 🔹 Load complaints + replies
  useEffect(() => {
    const loadComplaints = async () => {
      try {
        setLoading(true);
        const token = user?.token || localStorage.getItem("ocp_token");

        // ✅ Fetch all complaints for the student
        const { data } = await axios.get("http://localhost:5000/api/complaints", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const complaintList = data.complaints || [];

        // ✅ Attach public replies for each complaint
        const withReplies = await Promise.all(
          complaintList.map(async (complaint) => {
            try {
              const { data: replies } = await axios.get(
                // 🟢 Change this endpoint if your backend route differs (check backend)
                `http://localhost:5000/api/replies/${complaint.id}`
              );
              return { ...complaint, public_replies: replies || [] };
            } catch (err) {
              console.error(
                `Error fetching replies for complaint ${complaint.id}:`,
                err.response?.data || err.message
              );
              return { ...complaint, public_replies: [] };
            }
          })
        );

        setComplaints(withReplies);
      } catch (err) {
        console.error("❌ Error loading complaints:", err);
        setError("Failed to load complaints. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadComplaints();
  }, [user]);

  // 🔹 Complaint Modal Component
  const renderComplaintModal = (complaint) => (
    <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-id">#{complaint.id}</div>
        <h3>{complaint.title}</h3>
        <p style={{ marginBottom: "10px" }}>{complaint.description}</p>

        <div><strong>Category:</strong> {complaint.category}</div>
        <div><strong>Urgency:</strong> {complaint.urgency || "Normal"}</div>
        <div><strong>Status:</strong> {complaint.status}</div>
        <div>
          <strong>Submitted:</strong>{" "}
          {new Date(complaint.created_at).toLocaleString("en-IN")}
        </div>
        {complaint.updated_at && (
          <div>
            <strong>Last Updated:</strong>{" "}
            {new Date(complaint.updated_at).toLocaleString("en-IN")}
          </div>
        )}

        {/* 💬 Admin Replies */}
        <div className="public-replies-section" style={{ marginTop: "18px" }}>
          <strong>Admin Replies:</strong>
          {complaint.public_replies?.length > 0 ? (
            <ul className="replies-list">
              {complaint.public_replies.map((reply) => (
                <li key={reply.id}>
                  <div className="reply-message">{reply.message}</div>
                  <small className="reply-time">
                    {new Date(reply.created_at).toLocaleString("en-IN")}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-replies">No replies yet.</p>
          )}
        </div>

        {/* 📎 Attachments */}
        {complaint.attachments?.length > 0 && (
          <div style={{ marginTop: "15px" }}>
            <strong>Attachments:</strong>
            <ul className="attachments-list">
              {complaint.attachments.map((file, index) => (
                <li key={index}>
                  <a
                    href={`http://localhost:5000/${file}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View File {index + 1}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ textAlign: "right", marginTop: "20px" }}>
          <button className="close-btn" onClick={() => setSelectedComplaint(null)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // 🔹 Render Main Page
  return (
    <div className="student-complaints">
      <div className="student-complaints-header">
        <h2>My Complaints</h2>
        <button onClick={() => navigate("/track")} className="track-btn">
          Track Complaint
        </button>
      </div>

      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <>
          {complaints.length === 0 ? (
            <div>No complaints yet.</div>
          ) : (
            <div className="complaints-grid">
              {complaints.map((c) => (
                <div key={c.id} className="complaint-card">
                  <div className="complaint-id">#{c.id}</div>
                  <h4>{c.title}</h4>

                  <p><strong>Category:</strong> {c.category}</p>
                  <p><strong>Urgency:</strong> {c.urgency || "Normal"}</p>

                  <p
                    className={`status ${c.status?.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {c.status}
                  </p>

                  <div className="complaint-meta">
                    Submitted on{" "}
                    {new Date(c.created_at).toLocaleDateString("en-IN")}
                  </div>

                  {/* 💬 Latest Reply */}
                  {c.public_replies?.length > 0 && (
                    <div className="latest-reply">
                      <strong>Latest Reply:</strong>{" "}
                      {c.public_replies[c.public_replies.length - 1].message}
                    </div>
                  )}

                  <button
                    className="view-btn"
                    onClick={() => setSelectedComplaint(c)}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selectedComplaint && renderComplaintModal(selectedComplaint)}
    </div>
  );
}
