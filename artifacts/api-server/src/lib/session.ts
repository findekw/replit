import type { Request, Response } from "express";

// ── Per-role sessions ────────────────────────────────────────────────────────
// Each access level (admin / office / user) gets its OWN signed cookie, so the
// same browser can be logged into several levels at once (e.g. admin in one tab
// and office in another) without one logout affecting the others. Cookies are
// signed by cookie-parser using SESSION_SECRET (see app.ts).

export type Role = "admin" | "office" | "user";

const COOKIE_NAMES: Record<Role, string> = {
  admin: "finde_admin",
  office: "finde_office",
  user: "finde_user",
};

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function cookieOptions() {
  // Only mark cookies Secure when the site is actually served over HTTPS.
  // Set COOKIE_SECURE=true once a TLS domain is configured. Until then (e.g.
  // plain-HTTP IP deployment) a Secure cookie would never be sent back by the
  // browser, silently breaking every login — so default to NOT secure +
  // SameSite=Lax (same-origin SPA + API, so Lax is sufficient).
  const secure = process.env.COOKIE_SECURE === "true";
  return {
    httpOnly: true,
    signed: true as const,
    secure,
    sameSite: (secure ? "none" : "lax") as "none" | "lax",
    maxAge: MAX_AGE_MS,
    path: "/",
  };
}

// Returns the authenticated id for the given role, or null if not logged in.
export function getSessionId(req: Request, role: Role): number | null {
  const raw = (req.signedCookies as Record<string, string | undefined> | undefined)?.[COOKIE_NAMES[role]];
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function setSession(res: Response, role: Role, id: number): void {
  res.cookie(COOKIE_NAMES[role], String(id), cookieOptions());
}

export function clearSession(res: Response, role: Role): void {
  res.clearCookie(COOKIE_NAMES[role], { path: "/" });
}
