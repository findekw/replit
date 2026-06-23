import { neon } from "@neondatabase/serverless";
import { drizzle as neonHttpDrizzle } from "drizzle-orm/neon-http";
import { drizzle as pgDrizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const rawUrl = process.env.DATABASE_URL;

// Replit's internal database lives on helium and needs standard pg (no SSL).
const isInternalDb =
  rawUrl.includes("helium") ||
  rawUrl.includes("localhost") ||
  rawUrl.includes("127.0.0.1");

function stripSslParams(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete("sslmode");
    u.searchParams.delete("channel_binding");
    return u.toString();
  } catch {
    return url;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let db: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let pool: any;

if (isInternalDb) {
  // ── Standard node-postgres ────────────────────────────────────────────────
  // Replit internal helium DB — no SSL, standard TCP connection.
  const { Pool } = pg;
  const pgPool = new Pool({
    connectionString: stripSslParams(rawUrl),
    ssl: false,
    max: 5,
  });
  pool = pgPool;
  db = pgDrizzle(pgPool, { schema });
} else {
  // ── Neon HTTP mode ────────────────────────────────────────────────────────
  // Uses HTTPS fetch requests — no raw TCP sockets, no WebSocket, no TLS
  // handshake. Works reliably in Vercel Lambda and all serverless runtimes.
  // "fetch failed" / "WebSocket disconnected" errors do not apply here.
  const sql = neon(rawUrl);
  pool = null; // Not available in HTTP mode; use db (Drizzle) for all queries.
  db = neonHttpDrizzle(sql, { schema });
}

export * from "./schema";
