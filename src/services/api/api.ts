// src/services/api/api.ts
import { API_URL } from "./config";

export async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
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
