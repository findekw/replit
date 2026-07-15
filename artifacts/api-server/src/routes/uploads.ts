import { Router, type Request, type Response, type IRouter } from "express";
import multer, { type FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";

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

/** Videos stream straight to disk; images go through sharp instead (below). */
function makeVideoStorage() {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext =
        file.mimetype === "video/webm" ? ".webm" :
        file.mimetype === "video/quicktime" ? ".mov" :
        ".mp4";
      cb(null, `video-${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`);
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

function fileUrl(file: Express.Multer.File) {
  return `/api/uploads/${file.filename}`;
}

router.post("/uploads/video", (req: Request, res: Response) => {
  uploadVideo.single("video")(req, res, (err: unknown) => {
    if (handleUploadError(err, res, "video")) return;

    if (!req.file) {
      res.status(400).json({ error: "لم يتم إرسال أي فيديو" });
      return;
    }

    console.log(
      `[Upload] Saved video: ${req.file.filename} | type: ${req.file.mimetype} | size: ${req.file.size} bytes`
    );

    res.json({ url: fileUrl(req.file), filename: req.file.filename });
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
