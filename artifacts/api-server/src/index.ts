import app from "./app";
import { logger } from "./lib/logger";
import { db, usersTable } from "@workspace/db";
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

async function ensureSessionTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_sessions (
      sid varchar NOT NULL,
      sess json NOT NULL,
      expire timestamp(6) NOT NULL,
      CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_session_expire ON user_sessions (expire)
  `);
}

async function ensureAdmin() {
  const email = "admin@aqar.kw";
  const password = "Admin@12345";
  const passwordHash = await bcrypt.hash(password, 12);

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existing) {
    await db
      .update(usersTable)
      .set({ passwordHash, role: "admin", status: "active" })
      .where(eq(usersTable.email, email));
    logger.info("Admin password synced");
  } else {
    await db.insert(usersTable).values({
      name: "مدير النظام",
      email,
      passwordHash,
      role: "admin",
      status: "active",
    });
    logger.info("Admin user created");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  try {
    await ensureSessionTable();
  } catch (e) {
    logger.error({ err: e }, "Failed to create sessions table");
  }

  try {
    await ensureAdmin();
  } catch (e) {
    logger.error({ err: e }, "Failed to ensure admin");
  }
});
