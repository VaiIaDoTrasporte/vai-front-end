import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "styled-components";
import { lightTheme, darkTheme } from "./styles/theme";
import { router } from "./router";
import "modern-normalize/modern-normalize.css";


const qc = new QueryClient();

// eslint-disable-next-line react-refresh/only-export-components
function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return (
    <ThemeProvider theme={prefersDark ?  lightTheme : darkTheme}>
      {children}
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <AppThemeProvider>
        <RouterProvider router={router} />
      </AppThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
