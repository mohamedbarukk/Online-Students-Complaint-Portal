// src/pages/AdminLogin.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const onChange = e => setForm({...form, [e.target.name]: e.target.value});

  const onSubmit = async e => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/login", form);
      const { token, user } = res.data;

      // ensure admin
      if (user.role !== "admin") {
        setError("Not an admin account");
        return;
      }

      // save via AuthContext
      login({ id: user.id, name: user.username, role: user.role, token });

      navigate("/admin"); // go to admin dashboard
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="ocp-wrap">
      <div className="ocp-card" style={{maxWidth:480, margin: "40px auto"}}>
        <h2>Admin Login</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={onChange} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={onChange} required />
          </div>
          <div className="submit-row">
            <button className="btn" type="submit">Login</button>
          </div>
        </form>
      </div>
    </div>
  );
}
