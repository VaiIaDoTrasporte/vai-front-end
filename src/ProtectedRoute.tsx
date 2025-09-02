import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute() {
  const authed = !!localStorage.getItem("auth-demo"); // troque por verificação real depois
  const loc = useLocation();
  return authed ? <Outlet /> : <Navigate to="/login" replace state={{ from: loc }} />;
}
