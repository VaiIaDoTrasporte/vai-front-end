// src/routers/guards.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "../services/auth/auth";

// Bloqueia quem NÃO está logado
export function RequireAuth() {
  const loc = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }
  return <Outlet />;
}

// Bloqueia quem JÁ está logado (para /login e /register)
export function PublicOnly() {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
