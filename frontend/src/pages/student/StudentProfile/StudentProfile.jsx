// src/pages/StudentProfile.jsx
import React from "react";
import { useAuth } from "../../../context/AuthContext";
import "./StudentProfile.css";
import { Edit3, Lock, LogOut } from "lucide-react";

export default function StudentProfile() {
  const { user } = useAuth();

  if (!user?.loggedIn) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h2>Please log in to view your profile.</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-wrapper">
        <div className="profile-header">
          <div className="avatar">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="profile-info">
            <h2>{user.name}</h2>
            <p>{user.role}</p>
          </div>
        </div>

        <div className="profile-details">
          <h3>Account Information</h3>
          <div className="detail-row">
            <span className="label">📧 Email</span>
            <span className="value">{user.email}</span>
          </div>
          <div className="detail-row">
            <span className="label">🎓 Role</span>
            <span className="value">{user.role}</span>
          </div>
          <div className="detail-row">
            <span className="label">🕒 Status</span>
            <span className="value active">Active</span>
          </div>
        </div>

        <div className="profile-actions">
          <button className="action-btn edit">
            <Edit3 size={16} /> Edit Profile
          </button>
          <button className="action-btn password">
            <Lock size={16} /> Change Password
          </button>
          <button className="action-btn logout">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
