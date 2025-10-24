import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import FrontPageImg from "../../assets/FrontPageImg.png";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/login", formData);
      const { token, user } = res.data;

      // ✅ Save user data in context + localStorage
      login({
        id: user.id,
        username: user.username,
        role: user.role,
        token,
      });

      // ✅ Store admin token for admin-related roles
      const adminRoles = ["admin", "faculty", "hod", "principal", "super_admin"];
      if (adminRoles.includes(user.role)) {
        localStorage.setItem("adminToken", token);
      } else {
        localStorage.removeItem("adminToken"); // clean up for normal users
      }

      alert("Login successful!");

      // ✅ Role-based redirection
      switch (user.role) {
        case "student":
          navigate("/student");
          break;

        case "faculty":
        case "admin":
          navigate("/admin");
          break;

        case "hod":
          navigate("/hod");
          break;

        case "principal":
          navigate("/principal");
          break;

        case "super_admin":
          navigate("/super-admin");
          break;

        default:
          navigate("/");
          break;
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-bg"
      style={{ backgroundImage: `url(${FrontPageImg})` }}
    >
      <div className="form-container">
        <h2>Welcome Back</h2>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="signup-text">
            Don’t have an account?{" "}
            <Link to="/signup" className="signup-link">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
