// @ts-nocheck
import express from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = express.Router();

router.get("/", async (_req, res) => {
  const started = Date.now();
  let dbStatus: "ok" | "error" = "ok";
  let dbLatencyMs: number | undefined;

  try {
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - started;
  } catch {
    dbStatus = "error";
  }

  const payload = {
    status: dbStatus === "ok" ? "ok" : "error",
    db: dbStatus,
    uptimeSeconds: Math.floor(process.uptime()),
    dbLatencyMs,
    timestamp: new Date().toISOString(),
  };

  res.status(dbStatus === "ok" ? 200 : 503).json(payload);
});

export default router;