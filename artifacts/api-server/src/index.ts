import app from "./app";
import { logger } from "./lib/logger";
import { db, adminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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
