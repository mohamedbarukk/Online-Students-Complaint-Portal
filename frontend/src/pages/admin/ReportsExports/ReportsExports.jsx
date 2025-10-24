import React, { useState } from "react";
import "./ReportsExports.css";

export default function ReportsExports() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const [visibility, setVisibility] = useState(""); // Public / Anonymous / All
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("ocp_token");

  // Fetch filtered preview (optional)
  const fetchPreview = async () => {
    setMessage("");
    setLoading(true);
    try {
      const q = new URLSearchParams({
        from: from || "",
        to: to || "",
        status: status || "",
        visibility: visibility || "",
      }).toString();

      const res = await fetch(`http://localhost:5000/api/admin/reports?${q}`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });

      if (!res.ok) throw new Error("Failed to fetch report preview");

      const data = await res.json();
      // you can display a small preview if you want; for now show counts
      setMessage(`Preview: ${data.count || data.length || 0} record(s)`);
    } catch (err) {
      console.error(err);
      setMessage("Error loading preview.");
    } finally {
      setLoading(false);
    }
  };

  // Export function (csv or pdf)
  const handleExport = async (format = "csv") => {
    setMessage("");
    setLoading(true);

    try {
      const q = new URLSearchParams({
        from: from || "",
        to: to || "",
        status: status || "",
        visibility: visibility || "",
        format,
      }).toString();

      const res = await fetch(`http://localhost:5000/api/admin/reports/export?${q}`, {
        method: "GET",
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Export failed");
      }

      const blob = await res.blob();
      // Build filename
      const filename = `complaints_${new Date().toISOString().slice(0,10)}.${format === "csv" ? "csv" : "pdf"}`;

      // trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMessage(`Exported ${filename}`);
    } catch (err) {
      console.error(err);
      setMessage("Export failed. See console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports-page">
      <h2 className="reports-title">Reports & Exports</h2>

      <div className="reports-panel">
        <h3>Filter Reports</h3>

        <div className="reports-row">
          <div className="control">
            <label>From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div className="control">
            <label>To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <div className="control">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Under Process">Under Process</option>
              <option value="Resolved">Resolved</option>
              <option value="Escalated">Escalated</option>
            </select>
          </div>

          <div className="control">
            <label>Visibility</label>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <option value="">All</option>
              <option value="Public">Public</option>
              <option value="Anonymous">Anonymous</option>
            </select>
          </div>
        </div>

        <div className="reports-actions">
        

          <button className="btn success" onClick={() => handleExport("csv")} disabled={loading}>
            Export CSV
          </button>

          <button className="btn danger" onClick={() => handleExport("pdf")} disabled={loading}>
            Export PDF
          </button>
        </div>

        {message && <div className="reports-message">{message}</div>}
      </div>
    </div>
  );
}
