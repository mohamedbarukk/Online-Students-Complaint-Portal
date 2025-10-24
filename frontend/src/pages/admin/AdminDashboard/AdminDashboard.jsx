import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({
    pending: 0,
    underProcess: 0,
    resolved: 0,
    total: 0,
  });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("adminToken");
        if (!token) {
          setError("Unauthorized: No admin token found. Please log in again.");
          setLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        const [summaryRes, recentRes] = await Promise.all([
          axios.get("http://localhost:5000/api/admin/summary", { headers }),
          axios.get("http://localhost:5000/api/admin/recent-complaints", { headers }),
        ]);

        setSummary(summaryRes.data || {});
        setRecentComplaints(recentRes.data || []);
      } catch (err) {
        console.error("Admin dashboard error:", err);
        setError("Failed to load dashboard data. Please re-login.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="admin-dashboard-container">
      {loading ? (
        <div className="loading-box">Loading dashboard...</div>
      ) : error ? (
        <div className="error-box">{error}</div>
      ) : (
        <>
          {/* === Top Section: Intro + Summary === */}
          <div className="dashboard-top">
            {/* Intro */}
            <div className="intro-section">
              <h1>Online Students Grievance Portal</h1>
              <p>
                Welcome, <br />
                This is your centralized dashboard to manage student grievances across all departments efficiently and transparently.
              </p>
              <ul className="feature-list">
                <li><span className="bullet">•</span> Monitor all student grievances in one place.</li>
                <li><span className="bullet">•</span> Track resolution progress and departmental performance.</li>
                <li><span className="bullet">•</span> Update grievance statuses instantly.</li>
                <li><span className="bullet">•</span> Maintain transparency and accountability.</li>
              </ul>
            </div>

            {/* Summary */}
            <div className="summary-section">
              <h3> Complaint Summary</h3>
              <div className="summary-cards">
                <div className="summary-card pending">
                  <h4>Pending</h4>
                  <p>{summary.pending}</p>
                </div>
                <div className="summary-card process">
                  <h4>Under Process</h4>
                  <p>{summary.underProcess}</p>
                </div>
                <div className="summary-card resolved">
                  <h4>Resolved</h4>
                  <p>{summary.resolved}</p>
                </div>
                <div className="summary-card total">
                  <h4>Total</h4>
                  <p>{summary.total}</p>
                </div>
              </div>
            </div>
          </div>

          {/* === Recent Complaints === */}
          <div className="recent-complaints">
            <h3> Recent Complaints</h3>
            {recentComplaints.length > 0 ? (
              <ul>
                {recentComplaints.map((c) => (
                  <li key={c.id} className="recent-item">
                    <div className="complaint-info">
                      <h4>{c.title}</h4>
                      <p className="date">
                        {new Date(c.created_at).toLocaleDateString()} — {c.category}
                      </p>
                    </div>
                    <span
                      className={`status-badge ${
                        c.status.toLowerCase().replace(" ", "-")
                      }`}
                    >
                      {c.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-complaints">No recent complaints found.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
