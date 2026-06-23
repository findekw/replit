import { getApiBase } from "./apiBase";
const BASE = getApiBase();

// Three fully independent identities, each with its own session cookie.
export interface UserIdentity {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
}

export interface OfficeIdentity {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  officeId: number | null;
  createdAt: string;
}

export interface AdminIdentity {
  id: number;
  name: string;
  email: string;
  status: string;
  createdAt: string;
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
  if (!res.ok) throw data as AuthError;
  return data as T;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: "include" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "غير مسجّل الدخول" }));
    throw data as AuthError;
  }
  return res.json() as Promise<T>;
}

export const authApi = {
  user: {
    register: (body: { name: string; email: string; phone: string; password: string }) =>
      apiPost<{ user: UserIdentity; message: string }>("/api/auth/user/register", body),
    login: (body: { email: string; password: string }) =>
      apiPost<{ user: UserIdentity; message: string }>("/api/auth/user/login", body),
    logout: () => apiPost<{ message: string }>("/api/auth/user/logout", {}),
    me: () => apiGet<{ user: UserIdentity }>("/api/auth/user/me"),
  },
  office: {
    register: (body: { name: string; email: string; phone: string; password: string; slug?: string; officeDescription?: string }) =>
      apiPost<{ officeUser: OfficeIdentity; officeId: number | null; message: string }>("/api/auth/office/register", body),
    login: (body: { email: string; password: string }) =>
      apiPost<{ officeUser: OfficeIdentity; officeId: number | null; message: string }>("/api/auth/office/login", body),
    logout: () => apiPost<{ message: string }>("/api/auth/office/logout", {}),
    me: () => apiGet<{ officeUser: OfficeIdentity; officeId: number | null }>("/api/auth/office/me"),
  },
  admin: {
    login: (body: { email: string; password: string }) =>
      apiPost<{ admin: AdminIdentity; message: string }>("/api/auth/admin/login", body),
    logout: () => apiPost<{ message: string }>("/api/auth/admin/logout", {}),
    me: () => apiGet<{ admin: AdminIdentity }>("/api/auth/admin/me"),
  },
};
