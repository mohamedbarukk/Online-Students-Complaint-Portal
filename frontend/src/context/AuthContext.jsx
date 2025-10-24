// src/context/AuthContext.jsx
import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Try to load saved auth from localStorage
  const savedUser = JSON.parse(localStorage.getItem("ocp_user") || "null");
  const savedToken = localStorage.getItem("ocp_token") || null;

  const [user, setUser] = useState(() => {
    if (savedUser && savedToken) {
      return { ...savedUser, token: savedToken, loggedIn: true };
    }
    return { loggedIn: false, id: null, username: null, role: null, token: null };
  });

  // login: accepts object { id, username, role, token }
  function login({ id, username, role, token }) {
    const u = { id, username, role };
    localStorage.setItem("ocp_token", token);
    localStorage.setItem("ocp_user", JSON.stringify(u));
    setUser({ ...u, token, loggedIn: true });
  }

  function logout() {
    localStorage.removeItem("ocp_token");
    localStorage.removeItem("ocp_user");
    setUser({ loggedIn: false, id: null, username: null, role: null, token: null });
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
