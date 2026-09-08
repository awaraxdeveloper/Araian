import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import SingleCompanyAdmin from "./components/SingleCompanyAdmin";

export default function App() {
  // Load saved session from localStorage on startup
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem("portal_session");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (sessionData) => {
    setSession(sessionData);
    localStorage.setItem("portal_session", JSON.stringify(sessionData));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem("portal_session");
  };

  if (!session) {
    return <LoginPage onLoginSuccess={handleLogin} />;
  }

  return (
    <SingleCompanyAdmin
      companyId={session.companyId}
      companyName={session.companyName || "Enterprise Portal"}
      currentUser={session.user || { username: "User", is_admin: false }}
      onLogout={handleLogout}
    />
  );
}
