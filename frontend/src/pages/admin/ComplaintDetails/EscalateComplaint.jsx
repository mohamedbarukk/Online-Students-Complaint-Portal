import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./EscalateComplaint.css";

export default function EscalateComplaint() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [selectedAuthority, setSelectedAuthority] = useState("");
  const [notifyAll, setNotifyAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token =
    localStorage.getItem("ocp_token") ||
    localStorage.getItem("token") ||
    null;

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/admin/complaints/${id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : undefined,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch complaint");
        const data = await response.json();
        setComplaint(data.complaint || data);
      } catch (err) {
        console.error(err);
        setError("Failed to load complaint details.");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [id, token]);

  const handleEscalate = async () => {
    if (!selectedAuthority && !notifyAll) {
      alert("Please select a higher authority or enable 'Notify All Parties'.");
      return;
    }

    const escalationData = {
      complaintId: id,
      higherAuthority: selectedAuthority,
      notifyAll,
    };

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/complaints/escalate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          body: JSON.stringify(escalationData),
        }
      );

      if (!response.ok) throw new Error("Failed to escalate complaint");
      const data = await response.json();
      alert(data.message || "Complaint escalated successfully!");
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert("Failed to escalate complaint.");
    }
  };

  if (loading) return <p className="text-center">Loading complaint...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!complaint) return <p className="text-center">Complaint not found.</p>;

  const attachments =
    complaint.attachments && typeof complaint.attachments === "string"
      ? JSON.parse(complaint.attachments)
      : Array.isArray(complaint.attachments)
      ? complaint.attachments
      : [];

  const firstAttachment = attachments[0];

  return (
    <div className="es-page">
      <div className="es-card">
        <h2 className="es-title">Escalate Complaint</h2>
        <p className="es-subtitle">
          Choose higher authority or notify all parties to escalate this complaint.
        </p>

        <div className="es-main">
          {/* Left: Complaint details */}
          <div className="es-info">
            <p>
              <strong>Complaint ID:</strong> #{complaint.id}
            </p>
            <p>
              <strong>Subject:</strong> {complaint.subject}
            </p>
            <p>
              <strong>Description:</strong> {complaint.description}
            </p>
            <p>
              <strong>Submitted On:</strong>{" "}
              {new Date(complaint.created_at).toLocaleString()}
            </p>
            <p>
              <strong>Current Urgency:</strong>{" "}
              <span className={`urgency urgency-${complaint.urgency?.toLowerCase()}`}>
                {complaint.urgency}
              </span>
            </p>
          </div>

          {/* Right: Image preview */}
          <div className="es-attachment-preview">
            {firstAttachment ? (
              <img
                src={`http://localhost:5000/${firstAttachment}`}
                alt="Attachment Preview"
                className="es-image"
              />
            ) : (
              <img
                src="/no-image.png"
                alt="No Attachment"
                className="es-image-placeholder"
              />
            )}
          </div>
        </div>

        {/* Escalation Options */}
        <div className="es-options">
          <label htmlFor="authority">Select Higher Authority</label>
          <select
            id="authority"
            value={selectedAuthority}
            onChange={(e) => setSelectedAuthority(e.target.value)}
          >
            <option value="">-- Choose Authority --</option>
            <option value="HOD">Head of Department</option>
            <option value="Principal">Principal</option>
            <option value="Super Admin">Super Admin</option>
          </select>

          <label className="es-checkbox">
            <input
              type="checkbox"
              checked={notifyAll}
              onChange={(e) => setNotifyAll(e.target.checked)}
            />
            Notify All Parties (HOD, Principal, Super Admin)
          </label>

          <button className="es-btn" onClick={handleEscalate}>
            Escalate Complaint
          </button>
        </div>
      </div>
    </div>
  );
}
