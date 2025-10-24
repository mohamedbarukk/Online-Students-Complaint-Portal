import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pending: 0,
    underProcess: 0,
    resolved: 0,
    total: 0,
  });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      const base = "http://localhost:5000";

      const statsUrl = `${base}/api/student/complaint-stats/${user.id}`;
      const recentUrl = `${base}/api/student/recent-complaints/${user.id}`;
      const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};

      try {
        const [statsRes, recentRes] = await Promise.all([
          axios.get(statsUrl, { headers }),
          axios.get(recentUrl, { headers }),
        ]);

        if (cancelled) return;

        const s = statsRes?.data ?? {};
        const pending = toNum(s.pending ?? s.pendingCount ?? 0);
        const underProcess = toNum(s.underProcess ?? s.under_process ?? 0);
        const resolved = toNum(s.resolved ?? s.resolvedCount ?? 0);
        const total = toNum(s.total ?? pending + underProcess + resolved);

        setStats({ pending, underProcess, resolved, total });

        const data = recentRes?.data;
        let recentList = Array.isArray(data)
          ? data
          : Array.isArray(data?.complaints)
          ? data.complaints
          : [];

        recentList = recentList.map((c) => ({
          id: c.id ?? Math.random().toString(36).slice(2, 9),
          title: c.title ?? "Untitled complaint",
          status: c.status ?? "Pending",
          created_at: c.created_at ?? null,
        }));

        setRecentComplaints(recentList);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        if (!cancelled) setError("Failed to load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="student-dashboard-container">
      {loading ? (
        <div className="loading-box">Loading your dashboard...</div>
      ) : error ? (
        <div className="error-box">{error}</div>
      ) : (
        <>
          {/* ===== HEADER + SUMMARY SECTION ===== */}
          <div className="dashboard-top">
            <div className="intro-section">
              <h1> Online Students Grievance Portal</h1>
              <p>
                Welcome, 
                <br />
                Manage, monitor, and track all your grievances efficiently — ensuring
                transparency, accountability, and a smoother redressal experience.
              </p>
              <ul className="feature-list">
                <li><span className="bullet" /> File grievances anytime, from anywhere.</li>
                <li><span className="bullet" /> Monitor complaint progress live.</li>
                <li><span className="bullet" /> Receive updates directly from staff.</li>
                <li><span className="bullet" /> 100% confidential and secure process.</li>
              </ul>
            </div>

            <div className="summary-section">
              <h3> Complaint Summary</h3>
              <div className="summary-cards">
                <div className="summary-card pending">
                  <h4>Pending</h4>
                  <p>{stats.pending}</p>
                </div>
                <div className="summary-card process">
                  <h4>Under Process</h4>
                  <p>{stats.underProcess}</p>
                </div>
                <div className="summary-card resolved">
                  <h4>Resolved</h4>
                  <p>{stats.resolved}</p>
                </div>
                <div className="summary-card total">
                  <h4>Total</h4>
                  <p>{stats.total}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ===== RECENT COMPLAINTS ===== */}
          <div className="recent-complaints">
            <h3> Recent Complaints</h3>
            {recentComplaints.length > 0 ? (
              <ul>
                {recentComplaints.map((c) => {
                  const date = c.created_at
                    ? new Date(c.created_at).toLocaleDateString()
                    : "Unknown";
                  const statusClass = c.status.toLowerCase().replace(/\s+/g, "-");
                  return (
                    <li key={c.id} className="recent-item">
                      <div className="complaint-info">
                        <h4>{c.title}</h4>
                        <p className="date">{date}</p>
                      </div>
                      <span className={`status-badge ${statusClass}`}>
                        {c.status}
                      </span>
                    </li>
                  );
                })}
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
