// src/pages/admin/ComplaintDetails/ViewComplaint.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ViewComplaint.css";

export default function ViewComplaint() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [notes, setNotes] = useState([]);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [internalNote, setInternalNote] = useState("");
  const [publicReply, setPublicReply] = useState("");
  const [error, setError] = useState("");

  const token =
    localStorage.getItem("ocp_token") ||
    localStorage.getItem("token") ||
    null;

  const api = axios.create({
    baseURL: "http://localhost:5000",
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
      "Content-Type": "application/json",
    },
  });

  // 📦 Load complaint details + notes + replies
  useEffect(() => {
    async function loadComplaintData() {
      try {
        setLoading(true);
        const [complaintRes, notesRes, repliesRes] = await Promise.all([
          api.get(`/api/admin/complaints/${id}`),
          api.get(`/api/admin/complaints/${id}/notes`),
          api.get(`/api/admin/complaints/${id}/replies`),
        ]);

        setComplaint(complaintRes.data?.complaint);
        setNotes(Array.isArray(notesRes.data) ? notesRes.data : []);
        setReplies(Array.isArray(repliesRes.data) ? repliesRes.data : []);
      } catch (err) {
        console.error("❌ Error loading complaint:", err);
        setError("Failed to load complaint details.");
      } finally {
        setLoading(false);
      }
    }

    loadComplaintData();
  }, [id]);

  // ⚙️ Update complaint status
  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Change status to "${newStatus}"?`)) return;
    try {
      setStatusUpdating(true);
      await api.put(`/api/admin/complaints/${id}/status`, {
        status: newStatus,
      });
      alert(`✅ Status updated to ${newStatus}`);
      setComplaint((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error("❌ Status update error:", err);
      alert("Error updating complaint status");
    } finally {
      setStatusUpdating(false);
    }
  };

  // 📝 Add internal note
  const handleAddNote = async () => {
    if (!internalNote.trim()) return alert("Please enter a note.");
    try {
      const res = await api.post(`/api/admin/complaints/${id}/notes`, {
        note: internalNote.trim(),
      });
      setNotes(res.data?.notes || []);
      setInternalNote("");
      alert("✅ Note added successfully!");
    } catch (err) {
      console.error("❌ Add note error:", err);
      alert("Failed to add note");
    }
  };

  // 📜 View notes history
  const handleViewNotesHistory = () => {
    if (!notes.length) return alert("No notes found.");
    const formatted = notes
      .map(
        (n) =>
          `${n.added_by || "Staff"} — ${
            n.created_at
              ? new Date(n.created_at).toLocaleString()
              : "Unknown time"
          }\n${n.note}`
      )
      .join("\n-----------------------------\n");
    alert(`🗒 Notes History:\n\n${formatted}`);
  };

  // 💬 Send public reply
  const handleSendReply = async () => {
    if (!publicReply.trim()) return alert("Please enter a reply message.");
    try {
      const res = await api.post(`/api/admin/complaints/${id}/replies`, {
        message: publicReply.trim(),
      });
      setReplies(res.data?.replies || []);
      setPublicReply("");
      alert("✅ Reply sent successfully!");
    } catch (err) {
      console.error("❌ Reply error:", err);
      alert("Failed to send reply");
    }
  };

  if (loading) return <div className="vc-loading">Loading complaint...</div>;
  if (error) return <div className="vc-error">{error}</div>;
  if (!complaint) return <div className="vc-error">Complaint not found.</div>;

  // 🔗 Handle attachments
  const attachments =
    complaint.attachments && typeof complaint.attachments === "string"
      ? JSON.parse(complaint.attachments)
      : Array.isArray(complaint.attachments)
      ? complaint.attachments
      : [];
  const firstAttachment = attachments?.[0];

  // ✅ Main UI
  return (
    <div className="vc-page">
      <div className="vc-header">
        <h2>Complaint #{complaint.id}</h2>
      </div>

      <div className="vc-card">
        {/* Complaint Info */}
        <div className="vc-row">
          <div className="vc-label">Submitted By</div>
          <div className="vc-value">
            {complaint.student_name} — {complaint.student_email}
          </div>
        </div>

        <div className="vc-row">
          <div className="vc-label">Submitted At</div>
          <div className="vc-value">
            {new Date(complaint.created_at).toLocaleString() || "-"}
          </div>
        </div>

        <div className="vc-row">
          <div className="vc-label">Category</div>
          <div className="vc-value">{complaint.category || "-"}</div>
        </div>

        <div className="vc-row">
          <div className="vc-label">Urgency</div>
          <div className="vc-value">
            <span
              className={`vc-urgency ${String(
                complaint.urgency || "Normal"
              ).toLowerCase()}`}
            >
              {complaint.urgency || "Normal"}
            </span>
          </div>
        </div>

        <div className="vc-row">
          <div className="vc-label">Status</div>
          <div className="vc-value">
            <span
              className={`vc-status ${String(complaint.status || "Submitted")
                .toLowerCase()
                .replace(/\s+/g, "-")}`}
            >
              {complaint.status || "Submitted"}
            </span>
          </div>
        </div>

        {/* 📎 Attachments Section */}
        {firstAttachment && (
          <div className="vc-row">
            <div className="vc-label">Attachment</div>
            <div className="vc-value">
              <a
                href={`http://localhost:5000/uploads/${firstAttachment}`}
                target="_blank"
                rel="noopener noreferrer"
                className="vc-attachment-link"
              >
               View Attached File
              </a>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="vc-actions">
          <button
            className="btn"
            onClick={() => handleStatusChange("Under Process")}
            disabled={statusUpdating}
          >
            {statusUpdating ? "Updating..." : "Mark Under Process"}
          </button>

          <button
            className="btn"
            onClick={() => handleStatusChange("Resolved")}
            disabled={statusUpdating}
          >
            Mark Resolved
          </button>

          <button
            className="btn escalate-btn"
            onClick={() => navigate(`/admin/escalate/${complaint.id}`)}
          >
            Escalate Complaint
          </button>
        </div>

        {/* Internal Notes */}
        <div className="vc-textarea-section">
          <h3>Internal Notes (Staff Only)</h3>
          {notes.length ? (
            <div className="vc-list">
              {notes.map((n) => (
                <div key={n.id} className="vc-note">
                  <div className="vc-note-meta">
                    {n.added_by || "Staff"} •{" "}
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                  <div className="vc-note-body">{n.note}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="vc-none">No internal notes yet.</div>
          )}

          <textarea
            placeholder="Add private note for staff..."
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
          />
          <div className="vc-btn-group">
            <button className="btn" onClick={handleAddNote}>
              Save Note
            </button>
            <button
              className="btn view-history-btn"
              onClick={handleViewNotesHistory}
            >
              View Notes History
            </button>
          </div>
        </div>

        {/* Public Replies */}
        <div className="vc-textarea-section">
          <h3>Public Replies</h3>
          {replies.length ? (
            <div className="vc-list">
              {replies.map((r) => (
                <div key={r.id} className="vc-reply">
                  <div className="vc-reply-meta">
                    {r.replied_by || "Admin"} •{" "}
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                  <div className="vc-reply-body">{r.message}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="vc-none"></div>
          )}

          <textarea
            placeholder="Write a reply for the user..."
            value={publicReply}
            onChange={(e) => setPublicReply(e.target.value)}
          />
          <button className="btn" onClick={handleSendReply}>
            Send Reply
          </button>
        </div>
      </div>
    </div>
  );
}
