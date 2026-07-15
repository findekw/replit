import { Router, type Request, type Response, type IRouter } from "express";
import multer, { type FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { spawn } from "child_process";

const router: IRouter = Router();

// On Vercel (and any read-only Lambda runtime) /var/task is not writable.
// /tmp is always writable and survives the length of the function invocation.
const UPLOADS_DIR = process.env.VERCEL
  ? "/tmp/uploads"
  : path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const ALLOWED_VIDEO_MIME = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Videos stream to disk under a temp name, then get transcoded (below) — a
 * 50MB upload shouldn't be buffered in memory the way images are.
 */
function makeVideoStorage() {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext =
        file.mimetype === "video/webm" ? ".webm" :
        file.mimetype === "video/quicktime" ? ".mov" :
        ".mp4";
      cb(null, `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`);
    },
  });
}

function makeFileFilter(allowed: Set<string>) {
  return (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!allowed.has(file.mimetype)) {
      (cb as any)(Object.assign(new Error("INVALID_TYPE"), { code: "INVALID_TYPE" }));
      return;
    }
    cb(null, true);
  };
}

// Images are held in memory (capped at MAX_IMAGE_SIZE_BYTES) so sharp can
// process them before anything touches the disk — the raw file is never stored.
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: makeFileFilter(ALLOWED_IMAGE_MIME),
});

/** Longest edge kept. Bigger than any slot the UI renders, on any screen. */
const MAX_IMAGE_EDGE = 1600;
const WEBP_QUALITY = 82;

/** Longest edge, not width: phone videos are portrait, and capping only the
 *  width left a 1080x1920 clip untouched — twice the pixels and twice the
 *  encode time of the 720x1280 it should be. */
const MAX_VIDEO_EDGE = 1280;

/**
 * Transcode to a format every phone can actually play.
 *
 * iPhones record .mov/HEVC, which Android browsers generally refuse — so a
 * video uploaded by one office was invisible to half its buyers. H.264/AAC in
 * MP4 plays everywhere. -movflags +faststart moves the index to the front of
 * the file so playback can start before the download finishes; without it a
 * phone buffers the whole clip first.
 */
function transcodeVideo(input: string, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", [
      "-i", input,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "28",
      // Fit inside a square box so portrait and landscape are both capped;
      // force_divisible_by keeps both sides even, which H.264 requires.
      "-vf",
      `scale=w=min(${MAX_VIDEO_EDGE}\\,iw):h=min(${MAX_VIDEO_EDGE}\\,ih)` +
        `:force_original_aspect_ratio=decrease:force_divisible_by=2`,
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      "-y", output,
    ]);

    let stderr = "";
    ff.stderr.on("data", (d) => { stderr += String(d); });
    ff.on("error", reject);
    ff.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`));
    });
  });
}

/**
 * Offices upload straight from the camera roll — 1-2MB posters and photos that
 * were being served at full resolution to every card in the grid. Downscale,
 * re-encode to WebP, and drop EXIF. `.rotate()` must run first: it bakes in the
 * EXIF orientation, otherwise stripping the metadata leaves phone photos on
 * their side.
 */
async function optimizeImage(buffer: Buffer): Promise<{ data: Buffer; ext: string }> {
  const data = await sharp(buffer)
    .rotate()
    .resize({
      width: MAX_IMAGE_EDGE,
      height: MAX_IMAGE_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  return { data, ext: ".webp" };
}

const uploadVideo = multer({
  storage: makeVideoStorage(),
  limits: { fileSize: MAX_VIDEO_SIZE_BYTES },
  fileFilter: makeFileFilter(ALLOWED_VIDEO_MIME),
});

function handleUploadError(err: unknown, res: Response, kind: "image" | "video"): boolean {
  if (!err) return false;
  const e = err as { code?: string; message?: string };
  console.error(`[Upload] ${kind} error:`, e.code, e.message);
  if (e.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({
      error: kind === "video" ? "حجم الفيديو كبير" : "حجم الصورة كبير",
      code: "FILE_TOO_LARGE",
    });
    return true;
  }
  if (e.code === "INVALID_TYPE") {
    res.status(400).json({ error: "نوع الملف غير مدعوم", code: "INVALID_TYPE" });
    return true;
  }
  res.status(500).json({ error: kind === "video" ? "فشل رفع الفيديو" : "فشل رفع الصورة" });
  return true;
}

router.post("/uploads/video", (req: Request, res: Response) => {
  uploadVideo.single("video")(req, res, async (err: unknown) => {
    if (handleUploadError(err, res, "video")) return;

    if (!req.file) {
      res.status(400).json({ error: "لم يتم إرسال أي فيديو" });
      return;
    }

    const tmpPath = req.file.path;
    const original = req.file.size;
    const filename = `video-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.mp4`;
    const outPath = path.join(UPLOADS_DIR, filename);
    const started = Date.now();

    try {
      await transcodeVideo(tmpPath, outPath);
      const size = (await fs.promises.stat(outPath)).size;

      console.log(
        `[Upload] Saved video: ${filename} | ${req.file.mimetype} ${original}B -> mp4 ${size}B ` +
          `(-${Math.round((1 - size / original) * 100)}%) in ${Date.now() - started}ms`,
      );

      res.json({ url: `/api/uploads/${filename}`, filename });
    } catch (e) {
      console.error("[Upload] video transcode failed:", e);
      await fs.promises.rm(outPath, { force: true });
      res.status(400).json({ error: "تعذّرت معالجة الفيديو، جرّب فيديو آخر", code: "PROCESSING_FAILED" });
    } finally {
      // The upload is only ever a staging copy — never leave it behind.
      await fs.promises.rm(tmpPath, { force: true });
    }
  });
});

router.post("/uploads/images", (req: Request, res: Response) => {
  uploadImage.single("image")(req, res, async (err: unknown) => {
    if (handleUploadError(err, res, "image")) return;

    if (!req.file?.buffer) {
      res.status(400).json({ error: "لم يتم إرسال أي صورة" });
      return;
    }

    const original = req.file.size;
    try {
      const { data, ext } = await optimizeImage(req.file.buffer);
      const filename = `image-${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
      await fs.promises.writeFile(path.join(UPLOADS_DIR, filename), data);

      console.log(
        `[Upload] Saved: ${filename} | ${req.file.mimetype} ${original}B -> webp ${data.length}B ` +
          `(-${Math.round((1 - data.length / original) * 100)}%)`,
      );

      res.json({ url: `/api/uploads/${filename}`, filename });
    } catch (e) {
      console.error("[Upload] image processing failed:", e);
      res.status(400).json({ error: "تعذّرت معالجة الصورة، جرّب صورة أخرى", code: "PROCESSING_FAILED" });
    }
  });
});

export default router;
