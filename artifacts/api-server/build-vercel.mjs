/**
 * Vercel build script — Vercel Build Output API v3
 *
 * Produces .vercel/output/ which Vercel deploys directly, bypassing all
 * framework detection, TypeScript scanning, and function auto-detection.
 *
 * Output structure:
 *   .vercel/output/
 *     config.json                    ← routes: all traffic → root function
 *     functions/
 *       index.func/
 *         .vc-config.json            ← Node.js runtime config
 *         package.json               ← type: commonjs
 *         index.js                   ← CJS bundle (Express app)
 *         pino-worker.js             ← pino worker files
 *         pino-file.js
 *         pino-pretty.js
 *         thread-stream-worker.js
 */
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm, mkdir, rename, readFile, writeFile, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";

globalThis.require = createRequire(import.meta.url);

const artifactDir  = path.dirname(fileURLToPath(import.meta.url));
const workspaceDir = path.resolve(artifactDir, "../..");
const srcDir       = path.resolve(artifactDir, "src");
const stagingDir   = path.resolve(artifactDir, "vercel-dist");

// Vercel Build Output API v3 paths
// [[path]].func is Vercel's catch-all function convention — handles ALL routes.
// index.func only handles / — catch-all is required for an Express app.
const vercelOutputDir = path.resolve(artifactDir, ".vercel", "output");
const funcDir         = path.resolve(vercelOutputDir, "functions", "[[path]].func");

// ---------------------------------------------------------------------------
// Inline entry — esbuild bundles this as the Lambda handler.
// Runs session-table + admin seed on cold start, then exports the Express app.
// ---------------------------------------------------------------------------
// NOTE: entryContents is written as CJS (require/module.exports) so that
// the app initialization is wrapped in try-catch. esbuild bundles all
// require() calls just like import statements. The try-catch lets us return
// the actual crash reason as JSON instead of silently crashing.
const entryContents = `
"use strict";

// ── Awaitable init wrapper ───────────────────────────────────────────────────
// _initPromise resolves once the app is ready AND the DB session table exists.
// The handler awaits it on every cold start; on warm invocations it is already
// settled and resolves instantly (no extra cost).

let _app = null;
let _initError = null;

const _initPromise = (async () => {
  // ── 1. Load Express app (synchronous init errors caught here)
  const appMod = require("./app");
  _app = appMod.default || appMod;

  // ── 2. Sessions are now cookie-based (no DB table needed).
  //       Just ensure the admin account exists using Drizzle HTTP queries.
  const { db, usersTable } = require("@workspace/db");
  const { eq } = require("drizzle-orm");
  const bcrypt = require("bcryptjs");

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
  } else {
    await db.insert(usersTable).values({
      name: "\u0645\u062f\u064a\u0631 \u0627\u0644\u0646\u0638\u0627\u0645",
      email,
      passwordHash,
      role: "admin",
      status: "active",
    });
  }
})().catch((e) => {
  _initError = e;
  console.error("[VERCEL_INIT_CRASH] " + (e && e.stack ? e.stack : String(e)));
});

// ── Request handler ─────────────────────────────────────────────────────────
// Async so we can await the init promise on cold starts.
async function handler(req, res) {
  await _initPromise;

  if (_initError || !_app) {
    const msg = _initError instanceof Error ? _initError.message : String(_initError ?? "App not initialized");
    const stack = _initError instanceof Error ? _initError.stack : undefined;
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "App initialization failed", message: msg, stack }));
    return;
  }

  return _app(req, res);
}

module.exports = handler;
module.exports.default = handler;
`;

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
async function buildVercel() {
  // ── 0. Validate required environment variables ────────────────────────────
  const REQUIRED_ENV_VARS = ["DATABASE_URL", "SESSION_SECRET"];
  const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error("\n❌  Missing required environment variables:");
    for (const v of missing) {
      console.error(`     • ${v}`);
    }
    console.error(
      "\n   Set these in Vercel → Project Settings → Environment Variables,\n" +
      "   then redeploy.\n",
    );
    process.exit(1);
  }
  console.log("✓ Environment variables present (DATABASE_URL, SESSION_SECRET)");

  // ── 0.5. Build workspace libs so .d.ts declarations exist for tsc ─────────
  // esbuild bundles TypeScript directly and doesn't need declarations, but tsc
  // (used by Vercel's framework detection or any post-build checks) requires
  // the referenced lib packages to have been compiled first.
  console.log("Building workspace libs (tsc --build)…");
  const tscBin = path.resolve(workspaceDir, "node_modules/.bin/tsc");
  execFileSync(tscBin, ["--build", "tsconfig.json"], {
    cwd: workspaceDir,
    stdio: "inherit",
  });
  console.log("✓ Workspace libs built");

  // ── 1. Clean staging + output dirs ───────────────────────────────────────
  await rm(stagingDir, { recursive: true, force: true });
  await mkdir(stagingDir, { recursive: true });
  await rm(vercelOutputDir, { recursive: true, force: true });
  await mkdir(funcDir, { recursive: true });

  // ── 2. Bundle with esbuild (CJS, no TypeScript type checking) ────────────
  await esbuild({
    stdin: {
      contents: entryContents,
      resolveDir: srcDir,
      loader: "ts",
      sourcefile: "index.ts",
    },
    platform: "node",
    bundle: true,
    format: "cjs",
    outdir: stagingDir,
    logLevel: "info",
    external: [
      // Native addons — cannot be bundled
      "*.node",
      "pg-native",
      "fsevents",
      // Heavy optional packages not used on Vercel
      "firebase-admin",
      "sharp",
      "better-sqlite3",
      "sqlite3",
      "canvas",
      "bcrypt",
      "argon2",
      "re2",
      // NOTE: @google-cloud/storage and googleapis are intentionally NOT
      // external — they are pure-JS, installed in node_modules, and imported
      // at module load time by objectStorage.ts, so they must be bundled or
      // the Lambda crashes before handling any request.
    ],
    plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
    sourcemap: false,
  });

  // ── 3. Move bundle into .vercel/output/functions/[[path]].func/ ──────────
  // esbuild names stdin input "stdin.js" (sourcefile only affects error msgs).
  // Rename it to "index.js" to match the handler declared in .vc-config.json.
  const mainSrc = path.join(stagingDir, "stdin.js");
  if (!existsSync(mainSrc)) {
    throw new Error(`esbuild output not found: ${mainSrc}`);
  }
  await rename(mainSrc, path.join(funcDir, "index.js"));

  // Move pino worker files alongside the main bundle
  for (const f of ["pino-worker.js", "pino-file.js", "pino-pretty.js", "thread-stream-worker.js"]) {
    const src = path.join(stagingDir, f);
    if (existsSync(src)) await rename(src, path.join(funcDir, f));
  }
  await rm(stagingDir, { recursive: true, force: true });

  // ── 4. Write Vercel Build Output API v3 config files ─────────────────────

  // .vc-config.json — tells Vercel this is a Node.js Lambda
  await writeFile(
    path.join(funcDir, ".vc-config.json"),
    JSON.stringify(
      {
        runtime: "nodejs20.x",
        handler: "index.js",
        launcherType: "Nodejs",
      },
      null,
      2,
    ),
  );

  // package.json — CJS mode so Node.js treats index.js as CommonJS
  await writeFile(
    path.join(funcDir, "package.json"),
    JSON.stringify({ type: "commonjs" }, null, 2),
  );

  // config.json — explicit catch-all route required so Vercel's edge router
  // forwards every request (including /api/*) to the [[path]].func function.
  // Without this, file-system routing produces 404 for nested paths.
  await writeFile(
    path.join(vercelOutputDir, "config.json"),
    JSON.stringify(
      {
        version: 3,
        routes: [
          // Route all traffic to the catch-all Express function
          { src: "/(.*)", dest: "/[[path]]" },
        ],
      },
      null,
      2,
    ),
  );

  console.log("✓ Vercel Build Output API v3 structure created:");
  console.log("    .vercel/output/config.json");
  console.log("    .vercel/output/functions/[[path]].func/index.js");
  console.log("    .vercel/output/functions/[[path]].func/.vc-config.json");
}

buildVercel().catch((err) => {
  console.error(err);
  process.exit(1);
});
