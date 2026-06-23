import { Router, type Request, type Response, type NextFunction, type IRouter } from "express";
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

const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext =
      file.mimetype === "image/png" ? ".png" :
      file.mimetype === "image/webp" ? ".webp" : ".jpg";
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
    cb(null, unique);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    (cb as any)(Object.assign(new Error("INVALID_TYPE"), { code: "INVALID_TYPE" }));
    return;
  }
  cb(null, true);
};

const upload = multer({ storage, limits: { fileSize: MAX_SIZE_BYTES }, fileFilter });

router.post("/uploads/images", (req: Request, res: Response) => {
  upload.single("image")(req, res, (err: unknown) => {
    if (err) {
      const e = err as { code?: string; message?: string };
      console.error("[Upload] Error:", e.code, e.message);
      if (e.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "حجم الصورة كبير", code: "FILE_TOO_LARGE" });
        return;
      }
      if (e.code === "INVALID_TYPE") {
        res.status(400).json({ error: "نوع الملف غير مدعوم", code: "INVALID_TYPE" });
        return;
      }
      res.status(500).json({ error: "فشل رفع الصورة" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "لم يتم إرسال أي صورة" });
      return;
    }

    console.log(
      `[Upload] Saved: ${req.file.filename} | type: ${req.file.mimetype} | size: ${req.file.size} bytes`
    );

    res.json({ url: `/api/uploads/${req.file.filename}`, filename: req.file.filename });
  });
});

export default router;
