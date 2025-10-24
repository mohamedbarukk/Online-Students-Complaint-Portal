import React from "react";
import { Link } from "react-router-dom";
import "./FrontPage.css";
import grievanceImg from "../assets/FrontPageImg.png"; // ✅ Ensure this image exists

export default function FrontPage() {
  return (
    <div className="frontpage">
      {/* ===== Navigation Bar ===== */}
      <nav className="navbar">
        <h2 className="logo">Students Grievance Portal</h2>
        <div className="nav-buttons">
          <Link to="/signup" className="btn outline">
            Sign Up
          </Link>
          <Link to="/login" className="btn filled">
            Log In
          </Link>
        </div>
      </nav>

      {/* ===== Hero Section ===== */}
      <section className="hero">
        <div className="hero-content">
          {/* --- Left Text --- */}
          <div className="hero-text">
            <h1>Your Voice, Your Rights</h1>
            <p>
              Empowering students to raise concerns, submit grievances, and
              track their complaint status — all in one transparent and secure
              platform.
            </p>

            <div className="hero-buttons">
              <Link to="/login" className="btn filled">
                Submit Complaint
              </Link>
              <Link to="/login" className="btn outline">
                Track Complaint
              </Link>
            </div>
          </div>

          {/* --- Right Image --- */}
          <div className="hero-image">
            <img
              src={grievanceImg}
              alt="Students discussing grievance"
              className="hero-illustration"
            />
          </div>
        </div>
      </section>

      {/* ===== Footer (Optional small credit) ===== */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} Online Grievance Portal. All rights reserved.</p>
      </footer>
    </div>
  );
}
