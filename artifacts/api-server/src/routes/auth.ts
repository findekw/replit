import { Router, type IRouter } from "express";
import { db, usersTable, adminsTable, officeUsersTable, officesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { logger } from "../lib/logger";
import { setSession, clearSession, getSessionId } from "../lib/session";
import { safe } from "../lib/authHelpers";

const router: IRouter = Router();

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Simple in-memory login rate limiter (per IP) ─────────────────────────────
// Blocks brute-force: max 10 login attempts per IP per 5 minutes. In-memory is
// fine for a single-instance deployment; resets on restart.
const LOGIN_MAX = 10;
const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const loginHits = new Map<string, { count: number; resetAt: number }>();

function loginLimiter(req: Request, res: Response, next: () => void): void {
  const ip = (req.ip || req.socket?.remoteAddress || "unknown") as string;
  const now = Date.now();
  const entry = loginHits.get(ip);
  if (!entry || now > entry.resetAt) {
    loginHits.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    next();
    return;
  }
  entry.count += 1;
  if (entry.count > LOGIN_MAX) {
    res.status(429).json({ error: "محاولات كثيرة جدًا، حاول مرة أخرى بعد قليل" });
    return;
  }
  next();
}

// Opportunistically drop expired entries so the map can't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [ip, e] of loginHits) if (now > e.resetAt) loginHits.delete(ip);
}, LOGIN_WINDOW_MS).unref?.();

const RESERVED_SLUGS = ["properties", "offices", "admin", "login", "register", "plans", "dashboard", "api", "health", "by-slug", "office-pages", "office"];

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug);
}

// ════════════════════════════════════════════════════════════════════════════
// USER flow — regular end-users (researchers / buyers). Cookie: finde_user
// ════════════════════════════════════════════════════════════════════════════

router.post("/auth/user/register", async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim() || null;
  const password = String(body.password ?? "");

  const errors: string[] = [];
  if (name.length < 2) errors.push("الاسم يجب أن يكون حرفين على الأقل");
  if (!isValidEmail(email)) errors.push("البريد الإلكتروني غير صالح");
  if (phone && phone.length < 8) errors.push("رقم الهاتف غير صالح");
  if (password.length < 8) errors.push("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
  if (errors.length > 0) { res.status(400).json({ error: "بيانات غير صالحة", details: errors }); return; }

  try {
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing) { res.status(409).json({ error: "البريد الإلكتروني مستخدم بالفعل" }); return; }

    const passwordHash = await bcrypt.hash(password, 12);
    const [newUser] = await db.insert(usersTable).values({ name, email, phone, passwordHash, status: "active" }).returning();
    if (!newUser) { res.status(500).json({ error: "فشل إنشاء الحساب، حاول مرة أخرى" }); return; }

    setSession(res, "user", newUser.id);
    res.status(201).json({ user: safe(newUser), message: "تم إنشاء الحساب بنجاح! مرحباً بك في فايند." });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("unique") || msg.includes("duplicate")) res.status(409).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
    else res.status(500).json({ error: "حدث خطأ في الخادم، حاول مرة أخرى" });
  }
});

router.post("/auth/user/login", loginLimiter, async (req: Request, res: Response): Promise<void> => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  if (!isValidEmail(email) || !password) { res.status(400).json({ error: "البريد الإلكتروني أو كلمة المرور غير صالحة" }); return; }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }); return;
    }
    if (user.status === "banned") { res.status(403).json({ error: "تم تعليق هذا الحساب، تواصل مع الدعم" }); return; }

    setSession(res, "user", user.id);
    res.json({ user: safe(user), message: "تم تسجيل الدخول بنجاح" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم، حاول مرة أخرى" });
  }
});

router.post("/auth/user/logout", (_req: Request, res: Response): void => {
  clearSession(res, "user");
  res.json({ message: "تم تسجيل الخروج بنجاح" });
});

router.get("/auth/user/me", async (req: Request, res: Response): Promise<void> => {
  const id = getSessionId(req, "user");
  if (!id) { res.status(401).json({ error: "غير مسجّل الدخول" }); return; }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) { clearSession(res, "user"); res.status(401).json({ error: "الجلسة غير صالحة" }); return; }
    res.json({ user: safe(user) });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// OFFICE flow — office login accounts (own one office). Cookie: finde_office
// ════════════════════════════════════════════════════════════════════════════

router.post("/auth/office/register", async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim() || null;
  const password = String(body.password ?? "");
  const providedSlug = String(body.slug ?? "").trim().toLowerCase();

  const errors: string[] = [];
  if (name.length < 2) errors.push("الاسم يجب أن يكون حرفين على الأقل");
  if (!isValidEmail(email)) errors.push("البريد الإلكتروني غير صالح");
  if (phone && phone.length < 8) errors.push("رقم الهاتف غير صالح");
  if (password.length < 8) errors.push("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
  if (providedSlug) {
    if (!isValidSlug(providedSlug)) errors.push("الرابط يجب أن يكون بأحرف إنجليزية صغيرة وأرقام وشرطات فقط (3-40 حرف)");
    else if (RESERVED_SLUGS.includes(providedSlug)) errors.push("هذا الرابط محجوز ولا يمكن استخدامه");
  }
  if (errors.length > 0) { res.status(400).json({ error: "بيانات غير صالحة", details: errors }); return; }

  try {
    const [existing] = await db.select({ id: officeUsersTable.id }).from(officeUsersTable).where(eq(officeUsersTable.email, email)).limit(1);
    if (existing) { res.status(409).json({ error: "البريد الإلكتروني مستخدم بالفعل" }); return; }

    function generateFallbackSlug(officeName: string): string {
      const ts = Date.now().toString().slice(-6);
      const latin = officeName.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      return latin.length >= 3 ? `${latin}-${ts}` : `office-${ts}`;
    }

    let slug = providedSlug && isValidSlug(providedSlug) && !RESERVED_SLUGS.includes(providedSlug) ? providedSlug : generateFallbackSlug(name);
    const [slugTaken] = await db.select({ id: officesTable.id }).from(officesTable).where(eq(officesTable.slug, slug)).limit(1);
    if (slugTaken) {
      if (providedSlug && isValidSlug(providedSlug)) { res.status(409).json({ error: "هذا الرابط مستخدم بالفعل، يرجى اختيار رابط آخر" }); return; }
      slug = slug + "-" + Date.now().toString().slice(-4);
    }

    const rawDesc = body.officeDescription;
    const officeDesc = rawDesc ? String(rawDesc).trim().slice(0, 250) : null;

    const [newOffice] = await db.insert(officesTable).values({
      name, nameAr: name, slug, phone: phone ?? null, email,
      active: false, featured: false, verified: false,
      ...(officeDesc ? { descriptionAr: officeDesc, description: officeDesc } : {}),
    }).returning({ id: officesTable.id });

    const passwordHash = await bcrypt.hash(password, 12);
    const [newOfficeUser] = await db.insert(officeUsersTable).values({
      name, email, phone, passwordHash, status: "pending", officeId: newOffice?.id ?? null,
    }).returning();
    if (!newOfficeUser) { res.status(500).json({ error: "فشل إنشاء الحساب، حاول مرة أخرى" }); return; }

    setSession(res, "office", newOfficeUser.id);
    res.status(201).json({
      officeUser: safe(newOfficeUser),
      officeId: newOffice?.id ?? null,
      message: "تم تقديم طلب التسجيل بنجاح. سيتم مراجعة حسابك وتفعيله خلال 24 ساعة.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("unique") || msg.includes("duplicate")) res.status(409).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
    else res.status(500).json({ error: "حدث خطأ في الخادم، حاول مرة أخرى" });
  }
});

router.post("/auth/office/login", loginLimiter, async (req: Request, res: Response): Promise<void> => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  if (!isValidEmail(email) || !password) { res.status(400).json({ error: "البريد الإلكتروني أو كلمة المرور غير صالحة" }); return; }

  try {
    const [ou] = await db.select().from(officeUsersTable).where(eq(officeUsersTable.email, email)).limit(1);
    if (!ou || !(await bcrypt.compare(password, ou.passwordHash))) {
      res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }); return;
    }
    if (ou.status === "banned") { res.status(403).json({ error: "تم تعليق هذا الحساب، تواصل مع الدعم" }); return; }

    setSession(res, "office", ou.id);
    logger.info({ officeUserId: ou.id, officeId: ou.officeId }, "Office login success");
    res.json({ officeUser: safe(ou), officeId: ou.officeId, message: "تم تسجيل الدخول بنجاح" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم، حاول مرة أخرى" });
  }
});

router.post("/auth/office/logout", (_req: Request, res: Response): void => {
  clearSession(res, "office");
  res.json({ message: "تم تسجيل الخروج بنجاح" });
});

router.get("/auth/office/me", async (req: Request, res: Response): Promise<void> => {
  const id = getSessionId(req, "office");
  if (!id) { res.status(401).json({ error: "غير مسجّل الدخول" }); return; }
  try {
    const [ou] = await db.select().from(officeUsersTable).where(eq(officeUsersTable.id, id)).limit(1);
    if (!ou) { clearSession(res, "office"); res.status(401).json({ error: "الجلسة غير صالحة" }); return; }
    res.json({ officeUser: safe(ou), officeId: ou.officeId });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ADMIN flow — no public registration. Cookie: finde_admin
// ════════════════════════════════════════════════════════════════════════════

router.post("/auth/admin/login", loginLimiter, async (req: Request, res: Response): Promise<void> => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  if (!isValidEmail(email) || !password) { res.status(400).json({ error: "البريد الإلكتروني أو كلمة المرور غير صالحة" }); return; }

  try {
    const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.email, email)).limit(1);
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }); return;
    }
    if (admin.status === "banned") { res.status(403).json({ error: "تم تعليق هذا الحساب" }); return; }

    setSession(res, "admin", admin.id);
    logger.info({ adminId: admin.id }, "Admin login success");
    res.json({ admin: safe(admin), message: "تم تسجيل الدخول بنجاح" });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم، حاول مرة أخرى" });
  }
});

router.post("/auth/admin/logout", (_req: Request, res: Response): void => {
  clearSession(res, "admin");
  res.json({ message: "تم تسجيل الخروج بنجاح" });
});

router.get("/auth/admin/me", async (req: Request, res: Response): Promise<void> => {
  const id = getSessionId(req, "admin");
  if (!id) { res.status(401).json({ error: "غير مسجّل الدخول" }); return; }
  try {
    const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.id, id)).limit(1);
    if (!admin) { clearSession(res, "admin"); res.status(401).json({ error: "الجلسة غير صالحة" }); return; }
    res.json({ admin: safe(admin) });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

export default router;
