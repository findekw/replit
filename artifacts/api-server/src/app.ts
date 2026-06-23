import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieSession from "cookie-session";
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

const isProduction = process.env.NODE_ENV === "production";

// ── Cookie-based sessions ────────────────────────────────────────────────────
// Stores session data (userId, userRole) in a signed cookie — no database
// connection required. Works reliably in Vercel Lambda and all serverless
// environments. Cookie size is tiny (< 200 bytes) for our use case.
app.use(
  cookieSession({
    name: "aqar.sid",
    secret: sessionSecret,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  }),
);

// Compatibility shim: cookie-session auto-saves on response and doesn't expose
// .save() / .destroy() / .id — add them so existing route handlers work unchanged.
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.session) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = req.session as any;
    if (typeof s.save !== "function") {
      s.save = (cb: (err?: unknown) => void) => cb();
    }
    if (typeof s.destroy !== "function") {
      s.destroy = (cb: (err?: unknown) => void) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).session = null;
        cb();
      };
    }
    if (s.id === undefined) {
      s.id = undefined; // placeholder so req.session.id doesn't throw
    }
  }
  next();
});

app.use("/api/uploads", express.static(path.resolve(process.cwd(), "uploads")));
app.use("/api", router);

export default app;
