import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AllComplaints.css";
import trashIcon from "../../../assets/trash.png";

export default function AllComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const token =
    localStorage.getItem("ocp_token") ||
    localStorage.getItem("token") ||
    null;

  const api = axios.create({
    baseURL: "http://localhost:5000",
    headers: { Authorization: token ? `Bearer ${token}` : undefined },
  });

  useEffect(() => {
    fetchComplaints();
    // eslint-disable-next-line
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/admin/complaints");
      const data = res.data?.complaints || res.data || [];
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Fetch complaints error:", err);
      setError(
        err?.response?.data?.message || "Failed to load complaints from server."
      );
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this complaint?"))
      return;

    try {
      await api.delete(`/api/admin/complaints/${id}`);
      setComplaints((prev) => prev.filter((c) => c.id !== id));
      alert("Complaint deleted successfully!");
    } catch (err) {
      console.error("❌ Delete complaint error:", err);
      alert("Failed to delete complaint. Please try again.");
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString() + " " + d.toLocaleTimeString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="allcomplaints-page">
      <div className="page-header">
        <h1>All Complaints</h1>
      </div>

      {loading ? (
        <div className="empty-state">Loading complaints...</div>
      ) : error ? (
        <div className="empty-state error">{error}</div>
      ) : complaints.length === 0 ? (
        <div className="empty-state">No complaints found.</div>
      ) : (
        <div className="complaints-container">
          {complaints.map((c) => {
            const id = c.id || c._id;
            const attachments =
              c.attachments && typeof c.attachments === "string"
                ? JSON.parse(c.attachments)
                : Array.isArray(c.attachments)
                ? c.attachments
                : [];

            const firstAttachment = attachments?.[0];

            return (
              <div key={id} className="complaint-card">
                <div className="complaint-header">
                  <h3 className="complaint-title">{c.title || c.subject}</h3>
                  <span className="complaint-date">
                    {formatDate(c.created_at)}
                  </span>
                </div>

                <p className="complaint-body">
                  {c.description
                    ? c.description.slice(0, 120) +
                      (c.description.length > 120 ? "..." : "")
                    : "No description provided."}
                </p>

                <div className="tags">
                  <span
                    className={`status-tag ${String(
                      c.status || "submitted"
                    )
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {c.status || "Submitted"}
                  </span>
                  <span
                    className={`urgency-tag ${String(
                      c.urgency || "Normal"
                    ).toLowerCase()}`}
                  >
                    {c.urgency || "Normal"}
                  </span>
                </div>

                {/* 📎 Attached file link (only if exists) */}
                {firstAttachment && (
                  <div className="attachment-link">
                    <a
                      href={`http://localhost:5000/${firstAttachment}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                       Attached_File
                    </a>
                  </div>
                )}

                {/* ✅ Buttons */}
                <div className="card-actions">
                  <button
                    className="vc-view-btn"
                    onClick={() => navigate(`/admin/complaints/${id}`)}
                  >
                    Take Action
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(id)}
                    title="Delete Complaint"
                  >
                    <img src={trashIcon} alt="Delete" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
