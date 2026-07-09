import type { Request, Response, NextFunction } from "express";
import { db, adminsTable, officeUsersTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getSessionId } from "./session";

// Strip secrets before returning any identity object to the client.
export function safe<T extends {
  passwordHash?: string;
  emailOtpHash?: string | null;
  emailOtpExpiresAt?: Date | null;
  emailOtpSentAt?: Date | null;
  emailOtpAttempts?: number;
}>(row: T): Omit<T, "passwordHash" | "emailOtpHash" | "emailOtpExpiresAt" | "emailOtpSentAt" | "emailOtpAttempts"> {
  const {
    passwordHash: _pw,
    emailOtpHash: _otpHash,
    emailOtpExpiresAt: _otpExpiresAt,
    emailOtpSentAt: _otpSentAt,
    emailOtpAttempts: _otpAttempts,
    ...rest
  } = row;
  return rest;
}

// ── Middlewares ──────────────────────────────────────────────────────────────
// Each guard checks ONLY its own role cookie, so the three sessions are fully
// independent. On success it attaches the resolved id to the request.

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const id = getSessionId(req, "admin");
  if (!id) { res.status(401).json({ error: "غير مسجّل الدخول كمسؤول" }); return; }
  (req as any).adminId = id;
  next();
}

export function requireUser(req: Request, res: Response, next: NextFunction): void {
  const id = getSessionId(req, "user");
  if (!id) { res.status(401).json({ error: "غير مسجّل الدخول" }); return; }
  (req as any).userId = id;
  next();
}

export function requireOffice(req: Request, res: Response, next: NextFunction): void {
  const id = getSessionId(req, "office");
  if (!id) { res.status(401).json({ error: "غير مسجّل الدخول كمكتب" }); return; }
  (req as any).officeUserId = id;
  next();
}

// ── Office helpers ───────────────────────────────────────────────────────────
// Resolve the office (business entity) id owned by the currently-logged-in
// office account. Returns null if not logged in as an office or not linked.
export async function getOfficeId(req: Request): Promise<number | null> {
  const officeUserId = getSessionId(req, "office");
  if (!officeUserId) return null;
  const [ou] = await db
    .select({ officeId: officeUsersTable.officeId })
    .from(officeUsersTable)
    .where(eq(officeUsersTable.id, officeUserId))
    .limit(1);
  return ou?.officeId ?? null;
}

// Convenience for routes that must be a logged-in office linked to an office.
// Sends the proper 401/403 response and returns null when unauthorized.
export async function requireOfficeId(req: Request, res: Response): Promise<number | null> {
  const officeUserId = getSessionId(req, "office");
  if (!officeUserId) { res.status(401).json({ error: "غير مسجّل الدخول كمكتب" }); return null; }
  const officeId = await getOfficeId(req);
  if (!officeId) { res.status(403).json({ error: "يجب أن تكون مكتب عقاري" }); return null; }
  return officeId;
}

export { adminsTable, officeUsersTable, usersTable };
