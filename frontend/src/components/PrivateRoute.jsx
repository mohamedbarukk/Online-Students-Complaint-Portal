// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ allowedRoles = [] }) {
  const { user } = useAuth();

  // If no user is logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user role is not allowed → redirect to homepage
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // If authenticated and role is allowed → render child routes
  return <Outlet />;
}
