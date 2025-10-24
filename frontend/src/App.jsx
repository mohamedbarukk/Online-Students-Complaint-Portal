// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// 🌐 ================= PUBLIC PAGES =================
import FrontPage from "./components/FrontPage";
import Login from "./pages/general/Login";
import Signup from "./pages/general/Signup";
import TrackComplaint from "./pages/general/TrackComplaint";

// 🔒 ================= SHARED COMPONENTS =================
import PrivateRoute from "./components/PrivateRoute";

// 🎓 ================= STUDENT PAGES =================
import StudentLayout from "./components/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard/StudentDashboard";
import ComplaintForm from "./components/ComplaintForm";
import StudentComplaints from "./pages/student/StudentComplaint/StudentComplaints";
import StudentProfile from "./pages/student/StudentProfile/StudentProfile";

// 🧑‍💼 ================= ADMIN PAGES =================
import AdminLogin from "./pages/admin/AdminLogin/AdminLogin";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard/AdminDashboard";
import AllComplaints from "./pages/admin/AllComplaints/AllComplaints";
import ViewComplaint from "./pages/admin/ComplaintDetails/ViewComplaint";
import EscalateComplaint from "./pages/admin/ComplaintDetails/EscalateComplaint";
import ReportsExports from "./pages/admin/ReportsExports/ReportsExports"; // 🆕 Added

// 🚀 ================= APP ROUTER =================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/" element={<FrontPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/track" element={<TrackComplaint />} />

        {/* ================= STUDENT ROUTES (Protected) ================= */}
        <Route element={<PrivateRoute allowedRoles={["student"]} />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="submit" element={<ComplaintForm />} />
            <Route path="my-complaints" element={<StudentComplaints />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>
        </Route>

        {/* ================= ADMIN ROUTES ================= */}
        {/* Public Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Area */}
        <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="complaints" element={<AllComplaints />} />
            <Route path="complaints/:id" element={<ViewComplaint />} />
            <Route path="escalate/:id" element={<EscalateComplaint />} />
            <Route path="reports" element={<ReportsExports />} /> {/* 🆕 Added */}
          </Route>
        </Route>

        {/* ================= 404 PAGE ================= */}
        <Route
          path="*"
          element={
            <div
              style={{
                padding: "100px",
                textAlign: "center",
                fontSize: "20px",
                color: "#555",
              }}
            >
              🚫 Page Not Found
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
