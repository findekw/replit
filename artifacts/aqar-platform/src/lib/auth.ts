import { getApiBase } from "./apiBase";
const BASE = getApiBase();

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  officeId: number | null;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  message: string;
}

export interface AuthError {
  error: string;
  details?: string[];
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({ error: "خطأ غير متوقع" }));

  if (!res.ok) {
    throw data as AuthError;
  }

  return data as T;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "غير مسجّل الدخول" }));
    throw data as AuthError;
  }

  return res.json() as Promise<T>;
}

export const authApi = {
  register: (body: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "user" | "office";
    slug?: string;
    officeDescription?: string;
  }) => apiPost<AuthResponse>("/api/auth/register", body),

  login: (body: { email: string; password: string }) =>
    apiPost<AuthResponse>("/api/auth/login", body),

  logout: () =>
    apiPost<{ message: string }>("/api/auth/logout", {}),

  me: () =>
    apiGet<{ user: AuthUser }>("/api/auth/me"),
};
