import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: Record<string, unknown>) {
        return {
          id: req["id"],
          method: req["method"],
          url: typeof req["url"] === "string" ? req["url"].split("?")[0] : req["url"],
        };
      },
      res(res: Record<string, unknown>) {
        return {
          statusCode: res["statusCode"],
        };
      },
    },
  }),
);

// Always-allowed production origins (hardcoded so they work even if
// ALLOWED_ORIGINS env var is not set in Vercel).
const PRODUCTION_ORIGINS = [
  "https://finde.co",
  "https://www.finde.co",
  "https://finde-dev-aqar-platform.vercel.app",
];

const extraOrigins = (process.env["ALLOWED_ORIGINS"] ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...PRODUCTION_ORIGINS, ...extraOrigins]));

app.use(
  cors({
    origin(requestOrigin, callback) {
      if (!requestOrigin) return callback(null, true);
      if (requestOrigin.startsWith("http://localhost")) return callback(null, true);
      // Allow all Replit dev domains (preview and published)
      if (requestOrigin.endsWith(".replit.dev")) return callback(null, true);
      if (requestOrigin.endsWith(".repl.co")) return callback(null, true);
      if (requestOrigin.endsWith(".replit.app")) return callback(null, true);
      if (allowedOrigins.includes(requestOrigin)) return callback(null, true);
      logger.warn({ origin: requestOrigin }, "CORS: blocked request from unlisted origin");
      return callback(new Error(`CORS: origin ${requestOrigin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required");
}

// ── Per-role signed cookies ──────────────────────────────────────────────────
// Identity is split across three independent signed cookies (finde_admin,
// finde_office, finde_user) so the same browser can hold several access levels
// at once. cookie-parser verifies the signatures using SESSION_SECRET. See
// lib/session.ts for the read/write/clear helpers.
app.use(cookieParser(sessionSecret));

// Uploads get a unique timestamped filename and are never rewritten in place,
// so they can be cached indefinitely. The default (max-age=0) forced a
// revalidation round-trip per image — a dozen of them before a listing grid
// could paint on mobile.
app.use(
  "/api/uploads",
  express.static(path.resolve(process.cwd(), "uploads"), {
    maxAge: "365d",
    immutable: true,
  }),
);
app.use("/api", router);

export default app;
