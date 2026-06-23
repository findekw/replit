import { Router, type IRouter } from "express";
import { db, usersTable, officesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash: _pw, ...safe } = user;
  return safe;
}

const RESERVED_SLUGS = ["properties", "offices", "admin", "login", "register", "plans", "dashboard", "api", "health", "by-slug", "office-pages"];

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug);
}

function validateRegister(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const password = String(body.password ?? "");
  const role = String(body.role ?? "user");
  const slug = String(body.slug ?? "").trim().toLowerCase();

  if (name.length < 2) errors.push("الاسم يجب أن يكون حرفين على الأقل");
  if (!isValidEmail(email)) errors.push("البريد الإلكتروني غير صالح");
  if (phone && phone.length > 0 && phone.length < 8) errors.push("رقم الهاتف غير صالح");
  if (password.length < 8) errors.push("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
  if (!["user", "office"].includes(role)) errors.push("نوع الحساب غير صالح");

  if (role === "office" && slug) {
    if (!isValidSlug(slug)) errors.push("الرابط يجب أن يكون بأحرف إنجليزية صغيرة وأرقام وشرطات فقط (3-40 حرف)");
    else if (RESERVED_SLUGS.includes(slug)) errors.push("هذا الرابط محجوز ولا يمكن استخدامه");
  }

  return errors;
}

router.post("/auth/register", async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const errors = validateRegister(body);

  if (errors.length > 0) {
    res.status(400).json({ error: "بيانات غير صالحة", details: errors });
    return;
  }

  const name = String(body.name).trim();
  const email = String(body.email).trim().toLowerCase();
  const phone = String(body.phone ?? "").trim() || null;
  const password = String(body.password);
  const role = String(body.role ?? "user") as "user" | "office";
  const providedSlug = String(body.slug ?? "").trim().toLowerCase();

  try {
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    let officeId: number | null = null;

    if (role === "office") {
      // Use provided slug if valid, otherwise auto-generate
      function generateFallbackSlug(officeName: string): string {
        const ts = Date.now().toString().slice(-6);
        // Try to extract Latin letters only (works when office name has English words)
        const latin = officeName.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
        if (latin.length >= 3) return `${latin}-${ts}`;
        // Fallback: office-{timestamp}
        return `office-${ts}`;
      }

      let slug = providedSlug && isValidSlug(providedSlug) && !RESERVED_SLUGS.includes(providedSlug)
        ? providedSlug
        : generateFallbackSlug(name);

      // Check slug uniqueness
      const existingSlug = await db.select({ id: officesTable.id }).from(officesTable).where(eq(officesTable.slug, slug)).limit(1);
      if (existingSlug.length > 0) {
        // If provided slug is taken, return error; otherwise append timestamp
        if (providedSlug && isValidSlug(providedSlug)) {
          res.status(409).json({ error: "هذا الرابط مستخدم بالفعل، يرجى اختيار رابط آخر" });
          return;
        }
        slug = slug + "-" + Date.now().toString().slice(-4);
      }

      const rawDesc = (req.body as any).officeDescription;
      const officeDescTrimmed = rawDesc ? String(rawDesc).trim().slice(0, 250) : null;

      const [newOffice] = await db
        .insert(officesTable)
        .values({
          name,
          nameAr: name,
          slug,
          phone: phone ?? null,
          email,
          active: false,
          featured: false,
          verified: false,
          ...(officeDescTrimmed ? { descriptionAr: officeDescTrimmed, description: officeDescTrimmed } : {}),
        })
        .returning({ id: officesTable.id });

      officeId = newOffice?.id ?? null;
    }

    const [newUser] = await db
      .insert(usersTable)
      .values({
        name,
        email,
        phone,
        passwordHash,
        role,
        status: role === "office" ? "pending" : "active",
        officeId,
      })
      .returning();

    if (!newUser) {
      res.status(500).json({ error: "فشل إنشاء الحساب، حاول مرة أخرى" });
      return;
    }

    req.session.userId = newUser.id;
    req.session.userRole = newUser.role;

    req.session.save((saveErr) => {
      if (saveErr) {
        console.error("Session save error (register):", saveErr);
        res.status(500).json({ error: "فشل حفظ الجلسة" });
        return;
      }
      res.status(201).json({
        user: safeUser(newUser),
        message:
          role === "office"
            ? "تم تقديم طلب التسجيل بنجاح. سيتم مراجعة حسابك وتفعيله خلال 24 ساعة."
            : "تم إنشاء الحساب بنجاح! مرحباً بك في عقار.",
      });
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      res.status(409).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
    } else {
      res.status(500).json({ error: "حدث خطأ في الخادم، حاول مرة أخرى" });
    }
  }
});

router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");

  if (!isValidEmail(email) || !password) {
    res.status(400).json({ error: "البريد الإلكتروني أو كلمة المرور غير صالحة" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      return;
    }

    if (user.status === "banned") {
      res.status(403).json({ error: "تم تعليق هذا الحساب، تواصل مع الدعم" });
      return;
    }

    req.session.userId = user.id;
    req.session.userRole = user.role;

    req.session.save((saveErr) => {
      if (saveErr) {
        logger.error({ err: saveErr }, "Session save error on login");
        res.status(500).json({ error: "فشل حفظ الجلسة" });
        return;
      }
      logger.info(
        { userId: user.id, role: user.role, sessionId: req.session.id, env: process.env.NODE_ENV },
        "Login success — session saved to DB",
      );
      res.json({
        user: safeUser(user),
        message: "تم تسجيل الدخول بنجاح",
      });
    });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم، حاول مرة أخرى" });
  }
});

router.post("/auth/logout", (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "فشل تسجيل الخروج" });
      return;
    }
    res.clearCookie("aqar.sid");
    res.json({ message: "تم تسجيل الخروج بنجاح" });
  });
});

router.get("/auth/me", async (req: Request, res: Response): Promise<void> => {
  logger.info(
    { sessionId: req.session.id, userId: req.session.userId ?? null, env: process.env.NODE_ENV },
    "auth/me — session check",
  );

  if (!req.session.userId) {
    res.status(401).json({ error: "غير مسجّل الدخول" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId))
      .limit(1);

    if (!user) {
      req.session.destroy(() => {});
      res.status(401).json({ error: "الجلسة غير صالحة" });
      return;
    }

    logger.info({ userId: user.id, role: user.role }, "auth/me — user authenticated");
    res.json({ user: safeUser(user) });
  } catch {
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

export default router;
