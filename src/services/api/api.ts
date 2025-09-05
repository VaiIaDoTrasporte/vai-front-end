// src/services/api/api.ts
import { API_URL } from "./config";
import { getToken } from "../auth/auth";

export async function api(path: string, options?: RequestInit) {
  const token = getToken();
  const isForm = typeof FormData !== "undefined" && options?.body instanceof FormData;
  const defaultHeaders: Record<string, string> = {};
  if (!isForm) defaultHeaders["Content-Type"] = "application/json";
  if (token) defaultHeaders["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...defaultHeaders, ...(options?.headers as Record<string, string> | undefined) },
  });

  if (!res.ok) {
    let errorMsg = `Erro ${res.status}: ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.message) errorMsg = body.message; // pega a mensagem do backend
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // ignora se não for JSON
    }
    throw new Error(errorMsg);
  }

  return res.json();
}
