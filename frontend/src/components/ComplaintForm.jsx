// src/components/ComplaintForm.jsx
import React, { useEffect, useRef, useState } from "react";
import "./ComplaintForm.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ComplaintForm() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [visibility, setVisibility] = useState("Public");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "video/mp4",
  ];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const maxFiles = 6;

  // Drag-drop setup
  useEffect(() => {
    const drop = dropRef.current;
    if (!drop) return;

    const onDragOver = (e) => {
      e.preventDefault();
      drop.classList.add("dragging");
    };
    const onDragLeave = (e) => {
      e.preventDefault();
      drop.classList.remove("dragging");
    };
    const onDrop = (e) => {
      e.preventDefault();
      drop.classList.remove("dragging");
      if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
    };

    drop.addEventListener("dragover", onDragOver);
    drop.addEventListener("dragleave", onDragLeave);
    drop.addEventListener("drop", onDrop);

    return () => {
      drop.removeEventListener("dragover", onDragOver);
      drop.removeEventListener("dragleave", onDragLeave);
      drop.removeEventListener("drop", onDrop);
    };
  }, [attachments]);

  // File handling
  const handleFiles = (fileList) => {
    setError("");
    const arr = Array.from(fileList);
    const accepted = [];
    const errors = [];

    for (const f of arr) {
      if (!allowedTypes.includes(f.type)) {
        errors.push(`${f.name}: type not allowed`);
        continue;
      }
      if (f.size > maxSize) {
        errors.push(`${f.name}: exceeds 5MB`);
        continue;
      }
      const already = attachments.find(
        (a) => a.name === f.name && a.size === f.size
      );
      if (already) continue;
      const preview = f.type.startsWith("image/") ? URL.createObjectURL(f) : null;
      accepted.push({ file: f, preview, name: f.name, size: f.size, type: f.type });
    }

    if (attachments.length + accepted.length > maxFiles) {
      errors.push(`You can upload up to ${maxFiles} files.`);
      const space = Math.max(0, maxFiles - attachments.length);
      accepted.splice(space);
    }

    if (accepted.length) setAttachments((s) => [...s, ...accepted]);
    if (errors.length) setError(errors.join("; "));
  };

  const onFileInput = (e) => {
    if (e.target.files?.length) handleFiles(e.target.files);
    e.target.value = null;
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => {
      const toRemove = prev[index];
      if (toRemove?.preview) URL.revokeObjectURL(toRemove.preview);
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  };

  const humanSize = (n) =>
    n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`;

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!title.trim() || !description.trim()) {
      setError("Please fill title and description.");
      return;
    }

    try {
      const token = user?.token || localStorage.getItem("ocp_token");
      if (!token) {
        setError("You must be logged in to submit a complaint.");
        navigate("/login");
        return;
      }

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category", category);
      formData.append("visibility", visibility);

      attachments.forEach((a) => formData.append("attachments", a.file));

      const res = await fetch("http://localhost:5000/api/complaints", {
        method: "POST",
        headers: {
        Authorization: `Bearer ${localStorage.getItem("ocp_token")}`, // or from context
       },
      body: formData,
       });


      const data = await res.json();
      if (res.ok) {
        setMessage(`Complaint submitted successfully! Your ID: #${data.complaintId}`);
        setTitle("");
        setDescription("");
        setCategory("");
        setAttachments([]);
      } else {
        setError(data.message || "Failed to submit complaint.");
      }
    } catch (err) {
      console.error(err);
      setError("Error submitting complaint. Try again.");
    }
  };

  return (
    <div className="ocp-wrap">
      <div className="ocp-card">
        <div className="ocp-header">
          <h2>Submit your complaint below.</h2>
        </div>

        <div className="tabs">
          <button type="button" className={`tab ${visibility === "Public" ? "active" : ""}`} onClick={() => setVisibility("Public")}>
            Public
          </button>
          <button type="button" className={`tab ${visibility === "Anonymous" ? "active" : ""}`} onClick={() => setVisibility("Anonymous")}>
            Anonymous
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Complaint Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short title" />
          </div>

          <div className="field">
            <label>Complaint Details</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue..." />
          </div>

          <div className="field">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">-- Select Category --</option>
              <option>Academic</option>
              <option>Library</option>
              <option>Infrastructure</option>
              <option>Examination</option>
              <option>Other</option>
            </select>
          </div>

          <div className="field">
            <label>Attachments</label>
            <div ref={dropRef} className="dropzone" onClick={() => fileInputRef.current?.click()}>
              <strong>Drag & drop files or click to browse</strong>
              <small>Allowed: jpg, png, gif, pdf, mp4 — max 5MB each</small>
              <input ref={fileInputRef} type="file" multiple accept="image/*,application/pdf,video/mp4" onChange={onFileInput} style={{ display: "none" }} />
            </div>

            <div className="attachments">
              {attachments.map((a, i) => (
                <div className="att-item" key={`${a.name}-${i}`}>
                  <div className="att-thumb">{a.preview ? <img src={a.preview} alt={a.name} /> : <span>📄</span>}</div>
                  <div className="att-meta"><div className="name">{a.name}</div><div className="size">{humanSize(a.size)}</div></div>
                  <div className="att-actions"><button type="button" onClick={() => removeAttachment(i)}>Remove</button></div>
                </div>
              ))}
            </div>
          </div>

          <div className="submit-row">
            <button type="submit" className="btn">Submit</button>
            <button type="button" className="btn secondary" onClick={() => { setTitle(""); setDescription(""); setCategory(""); setAttachments([]); setMessage(""); setError(""); }}>Reset</button>
          </div>

          {message && <div className="message">{message}</div>}
          {error && <div className="error">{error}</div>}
        </form>
      </div>
    </div>
  );
}
