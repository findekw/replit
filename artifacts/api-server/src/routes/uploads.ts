import { Router, type Request, type Response, type IRouter } from "express";
import multer, { type FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";

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

function makeStorage(kind: "image" | "video") {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext =
        file.mimetype === "image/png" ? ".png" :
        file.mimetype === "image/webp" ? ".webp" :
        file.mimetype === "video/webm" ? ".webm" :
        file.mimetype === "video/quicktime" ? ".mov" :
        kind === "video" ? ".mp4" : ".jpg";
      const unique = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
      cb(null, unique);
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

const uploadImage = multer({
  storage: makeStorage("image"),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: makeFileFilter(ALLOWED_IMAGE_MIME),
});

const uploadVideo = multer({
  storage: makeStorage("video"),
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
  uploadImage.single("image")(req, res, (err: unknown) => {
    if (handleUploadError(err, res, "image")) return;

    if (!req.file) {
      res.status(400).json({ error: "لم يتم إرسال أي صورة" });
      return;
    }

    console.log(
      `[Upload] Saved: ${req.file.filename} | type: ${req.file.mimetype} | size: ${req.file.size} bytes`
    );

    res.json({ url: fileUrl(req.file), filename: req.file.filename });
  });
});

export default router;
