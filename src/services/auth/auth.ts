/* eslint-disable @typescript-eslint/no-explicit-any */
// src/auth.ts
export function getToken() {
  try {
    const raw = localStorage.getItem("auth-demo");
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.token || null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getToken();
}

export function logout() {
  localStorage.removeItem("auth-demo");
}

// Helpers to read full auth payload and user data stored at login
export type StoredAuth = {
  token: string;
  usuario?: any;
  ts?: number;
} | null;

export function getAuthData(): StoredAuth {
  try {
    const raw = localStorage.getItem("auth-demo");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getStoredUser<T = any>(): T | null {
  const data = getAuthData();
  return (data && (data as any).usuario) ? (data as any).usuario as T : null;
}
