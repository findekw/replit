import app from "./app";
import { logger } from "./lib/logger";
import { db, adminsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Idempotent, additive schema guards. The self-hosted deploy has no separate
// migration step, so we bring the DB up to date on boot (before serving) with
// safe "ADD COLUMN IF NOT EXISTS" statements — a no-op once applied.
async function ensureSchema() {
  await db.execute(sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz`);
  // Per-listing contact numbers (WhatsApp required, mobile optional at the form).
  await db.execute(sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS whatsapp text`);
  await db.execute(sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS phone text`);
  // Backfill legacy listings from their office's numbers so existing ads keep
  // showing contact buttons after the switch to per-listing numbers.
  await db.execute(sql`UPDATE properties p SET whatsapp = o.whatsapp FROM offices o WHERE p.office_id = o.id AND p.whatsapp IS NULL AND o.whatsapp IS NOT NULL`);
  await db.execute(sql`UPDATE properties p SET phone = o.phone FROM offices o WHERE p.office_id = o.id AND p.phone IS NULL AND o.phone IS NOT NULL`);
  logger.info("Schema ensured");
}

// Seed / sync the default platform administrator in the dedicated admins table.
async function ensureAdmin() {
  const email = "admin@aqar.kw";
  const password = "Admin@12345";
  const passwordHash = await bcrypt.hash(password, 12);

  const [existing] = await db
    .select({ id: adminsTable.id })
    .from(adminsTable)
    .where(eq(adminsTable.email, email))
    .limit(1);

  if (existing) {
    await db
      .update(adminsTable)
      .set({ passwordHash, status: "active" })
      .where(eq(adminsTable.email, email));
    logger.info("Admin password synced");
  } else {
    await db.insert(adminsTable).values({
      name: "مدير النظام",
      email,
      passwordHash,
      status: "active",
    });
    logger.info("Admin user created");
  }
}

async function bootstrap() {
  // Apply pending additive schema changes BEFORE accepting requests, so no
  // request can hit a column the DB doesn't have yet on a fresh deploy.
  try {
    await ensureSchema();
  } catch (e) {
    logger.error({ err: e }, "Failed to ensure schema");
  }

  app.listen(port, async (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");

    try {
      await ensureAdmin();
    } catch (e) {
      logger.error({ err: e }, "Failed to ensure admin");
    }
  });
}

bootstrap();
