import { db, platformSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

/** Read a platform setting with a fallback. Small table, no caching needed. */
export async function getSetting(key: string, fallback: string): Promise<string> {
  try {
    const [row] = await db
      .select({ value: platformSettingsTable.value })
      .from(platformSettingsTable)
      .where(eq(platformSettingsTable.key, key))
      .limit(1);
    return row?.value ?? fallback;
  } catch {
    return fallback;
  }
}

/** Free-trial length in days — admin-editable, clamped to something sane. */
export async function getTrialDays(): Promise<number> {
  const n = Number(await getSetting("trial_days", "14"));
  if (!Number.isFinite(n) || n < 1) return 14;
  return Math.min(Math.round(n), 365);
}
