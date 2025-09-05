import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Home from "../pages/Home";
import { RequireAuth, PublicOnly } from "./guards";
import ProfileEdit from "../pages/ProfileEdit";

export const router = createBrowserRouter([
  // Rotas públicas (se logado, redireciona para "/")
  {
    element: <PublicOnly />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
    ],
  },

  // Rotas privadas (precisa de token)
  {
    element: <RequireAuth />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/profile/edit", element: <ProfileEdit /> },
    ],
  },

  // Fallback
  { path: "*", element: <Navigate to="/" replace /> },
]);
