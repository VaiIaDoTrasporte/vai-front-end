// src/app/router.tsx
import { createBrowserRouter } from "react-router-dom";
import Login from "../pages/Login";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/", element: <div /> }, // depois protegemos esta
]);
