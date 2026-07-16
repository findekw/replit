import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListGovernorates } from "@workspace/api-client-react";
import { getAreasByGovId } from "@/lib/kuwait-areas";
import { useOfficeAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, CheckCircle, AlertCircle, ArrowRight,
  Camera, X, ImagePlus, Upload, Star, ChevronDown, Video, Trash2
} from "lucide-react";
import { Link } from "wouter";
import { LocationCombobox } from "@/components/LocationCombobox";

const PROPERTY_STATUSES = ["للإيجار", "للبيع", "للبدل"];
const TYPES_BY_STATUS: Record<string, string[]> = {
  "للإيجار": ["بيت", "قسيمة", "ارض", "دور", "شقة", "محل", "مكتب", "مخزن", "شاليه", "استراحة", "مزرعة", "عمارة", "مجمع", "قسيمة صناعية", "قسيمة حرفية"],
  "للبيع":   ["بيت", "قسيمة", "ارض", "دور", "شقة", "محل", "مكتب", "مخزن", "شاليه", "استراحة", "مزرعة", "عمارة", "مجمع", "قسيمة صناعية", "قسيمة حرفية"],
  "للبدل":   ["بيت", "قسيمة", "ارض", "شقة", "طلب"],
};

import { getApiBase } from "@/lib/apiBase";
const BASE = getApiBase();

const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
// Fallbacks only. The live lists come from /api/catalog (admin-editable); these
// keep the form working if that request fails.
const FURNISHED_FALLBACK = ["مفروش", "غير مفروش", "شبه مفروش"];
const AMENITY_FALLBACK = [
  "مواقف سيارات",
  "مصعد",
  "بلكونة",
  "مسبح",
  "حديقة",
  "أمن",
  "غرفة خادمة",
  "غرفة سائق",
  "تكييف مركزي",
  "إطلالة بحرية",
  "مطبخ مجهز",
];

interface UploadedImage {
  id: string;
  dbId?: number;
  previewUrl: string;
  isPrimary: boolean;
  saving: boolean;
  saved: boolean;
  error: string | null;
}

interface UploadedVideo {
  previewUrl: string;
  saving: boolean;
  saved: boolean;
  error: string | null;
}

export default function DashboardAddListing() {
  const [, navigate] = useLocation();
  const { officeUser: user } = useOfficeAuth();
  const { toast } = useToast();

  // Step 1 state: form fields
  const [step, setStep] = useState<1 | 2>(1);
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [titleAr, setTitleAr] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState("");
  const currency = "KWD";
  const [areaSize, setAreaSize] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [furnished, setFurnished] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);

  // Admin-editable option lists; fall back to the built-in defaults on failure.
  const [furnishedOptions, setFurnishedOptions] = useState<string[]>(FURNISHED_FALLBACK);
  const [amenityOptions, setAmenityOptions] = useState<string[]>(AMENITY_FALLBACK);
  useEffect(() => {
    let alive = true;
    fetch(`${BASE}/api/catalog`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { furnished?: string[]; amenity?: string[] }) => {
        if (!alive) return;
        if (data.furnished?.length) setFurnishedOptions(data.furnished);
        if (data.amenity?.length) setAmenityOptions(data.amenity);
      })
      .catch(() => {/* keep fallbacks */});
    return () => { alive = false; };
  }, []);
  const [showExtras, setShowExtras] = useState(false);
  const [governorateId, setGovernorateId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Step 2 state: image upload
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { data: govs } = useListGovernorates();
  const areas = governorateId ? getAreasByGovId(Number(governorateId)) : [];

  const isUploading = uploadedImages.some((img) => img.saving) || uploadedVideo?.saving === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clientErrors: string[] = [];
    if (titleAr.trim().length < 5) clientErrors.push("العنوان يجب أن يكون 5 أحرف على الأقل");
    if (!status) clientErrors.push("يرجى اختيار نوع العرض");
    if (!type) clientErrors.push("يرجى اختيار نوع العقار");
    if (!price || Number(price) <= 0) clientErrors.push("يرجى إدخال سعر صحيح");
    if (!governorateId) clientErrors.push("يرجى اختيار المحافظة");
    if (!areaId) clientErrors.push("يرجى اختيار المنطقة");
    if (descriptionAr.trim().length < 10) clientErrors.push("وصف الإعلان يجب أن يكون 10 أحرف على الأقل");

    if (clientErrors.length > 0) { setErrors(clientErrors); return; }

    setSubmitting(true);
    setErrors([]);

    try {
      const res = await fetch(`${BASE}/api/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          titleAr: titleAr.trim(),
          status,
          type,
          price: Number(price),
          currency,
          areaSize: areaSize ? Number(areaSize) : undefined,
          bedrooms: bedrooms ? Number(bedrooms) : undefined,
          bathrooms: bathrooms ? Number(bathrooms) : undefined,
          furnished: furnished || undefined,
          amenities,
          governorateId: governorateId ? Number(governorateId) : undefined,
          areaId: areaId ? Number(areaId) : undefined,
          descriptionAr: descriptionAr.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors(data.details ?? [data.error ?? "حدث خطأ غير متوقع"]);
        return;
      }

      setPropertyId(data.property.id);
      setStep(2);
    } catch {
      setErrors(["حدث خطأ في الاتصال، حاول مرة أخرى"]);
    } finally {
      setSubmitting(false);
    }
  };

  async function handleFiles(files: FileList | File[]) {
    if (!propertyId) return;

    const remaining = 10 - uploadedImages.filter((img) => !img.error).length;
    const fileArr = Array.from(files).slice(0, remaining);
    if (!fileArr.length) return;

    for (const file of fileArr) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const previewUrl = URL.createObjectURL(file);
      const hasSavedImage = uploadedImages.some((img) => img.saved);

      // Client-side validation
      if (!ALLOWED_TYPES.has(file.type)) {
        console.error(`[Upload] Invalid file type: "${file.type}" for "${file.name}"`);
        setUploadedImages((prev) => [
          ...prev,
          { id, previewUrl, isPrimary: false, saving: false, saved: false, error: "نوع الملف غير مدعوم (JPG, PNG, WEBP فقط)" },
        ]);
        continue;
      }

      if (file.size > MAX_SIZE_BYTES) {
        console.error(`[Upload] File too large: ${file.size} bytes for "${file.name}"`);
        setUploadedImages((prev) => [
          ...prev,
          { id, previewUrl, isPrimary: false, saving: false, saved: false, error: "حجم الصورة كبير (الحد الأقصى 5 ميغابايت)" },
        ]);
        continue;
      }

      const isPrimary = !hasSavedImage;

      // Add saving placeholder
      setUploadedImages((prev) => [
        ...prev,
        { id, previewUrl, isPrimary, saving: true, saved: false, error: null },
      ]);

      try {
        // Step 1: Upload file
        const formData = new FormData();
        formData.append("image", file);
        console.log(`[Upload] Uploading "${file.name}" (${file.type}, ${file.size} bytes)`);

        const uploadRes = await fetch(`${BASE}/api/uploads/images`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          const errMsg: string = errData.error || "فشل رفع الصورة";
          console.error(`[Upload] Server rejected "${file.name}": ${errMsg} (${uploadRes.status})`);
          setUploadedImages((prev) =>
            prev.map((img) => img.id === id ? { ...img, saving: false, error: errMsg } : img)
          );
          continue;
        }

        const { url } = (await uploadRes.json()) as { url: string };
        console.log(`[Upload] File uploaded: ${url}`);

        // Step 2: Save URL to DB
        const saveRes = await fetch(`${BASE}/api/properties/${propertyId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ url, isPrimary }),
        });

        if (!saveRes.ok) {
          const saveErr = await saveRes.json().catch(() => ({}));
          console.error(`[Upload] Failed to save "${file.name}" to DB:`, saveErr);
          setUploadedImages((prev) =>
            prev.map((img) => img.id === id ? { ...img, saving: false, error: "فشل حفظ الصورة" } : img)
          );
          continue;
        }

        const savedImg = (await saveRes.json()) as { image?: { id?: number } };
        const dbId = savedImg?.image?.id;
        console.log(`[Upload] "${file.name}" saved successfully, dbId=${dbId}`);
        setUploadedImages((prev) =>
          prev.map((img) => img.id === id ? { ...img, saving: false, saved: true, error: null, dbId } : img)
        );
      } catch (err) {
        console.error(`[Upload] Network error for "${file.name}":`, err);
        setUploadedImages((prev) =>
          prev.map((img) => img.id === id ? { ...img, saving: false, error: "خطأ في الاتصال، حاول مرة أخرى" } : img)
        );
      }
    }
  }

  function toggleAmenity(value: string) {
    setAmenities((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  }

  async function handleVideoFile(file: File) {
    if (!propertyId) return;

    const previewUrl = URL.createObjectURL(file);

    if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
      setUploadedVideo({ previewUrl, saving: false, saved: false, error: "نوع الفيديو غير مدعوم (MP4, WEBM, MOV فقط)" });
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      setUploadedVideo({ previewUrl, saving: false, saved: false, error: "حجم الفيديو كبير (الحد الأقصى 50 ميغابايت)" });
      return;
    }

    setUploadedVideo({ previewUrl, saving: true, saved: false, error: null });

    try {
      const formData = new FormData();
      formData.append("video", file);

      const uploadRes = await fetch(`${BASE}/api/uploads/video`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        setUploadedVideo({ previewUrl, saving: false, saved: false, error: errData.error || "فشل رفع الفيديو" });
        return;
      }

      const { url } = (await uploadRes.json()) as { url: string };
      const saveRes = await fetch(`${BASE}/api/properties/${propertyId}/video`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ videoUrl: url }),
      });

      if (!saveRes.ok) {
        const saveErr = await saveRes.json().catch(() => ({}));
        setUploadedVideo({ previewUrl, saving: false, saved: false, error: saveErr.error || "فشل حفظ الفيديو" });
        return;
      }

      setUploadedVideo({ previewUrl, saving: false, saved: true, error: null });
    } catch {
      setUploadedVideo({ previewUrl, saving: false, saved: false, error: "خطأ في الاتصال، حاول مرة أخرى" });
    }
  }

  async function removeVideo() {
    if (propertyId) {
      await fetch(`${BASE}/api/properties/${propertyId}/video`, {
        method: "DELETE",
        credentials: "include",
      }).catch(() => {});
    }
    if (uploadedVideo?.previewUrl) URL.revokeObjectURL(uploadedVideo.previewUrl);
    setUploadedVideo(null);
  }

  async function removeImage(id: string) {
    const img = uploadedImages.find((i) => i.id === id);
    if (img?.dbId && propertyId) {
      await fetch(`${BASE}/api/properties/${propertyId}/images/${img.dbId}`, {
        method: "DELETE",
        credentials: "include",
      }).catch(() => {});
    }
    setUploadedImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      if (updated.length > 0 && !updated.some((img) => img.isPrimary && img.saved)) {
        const firstSaved = updated.find((img) => img.saved);
        if (firstSaved) firstSaved.isPrimary = true;
      }
      return updated;
    });
  }

  async function setPrimary(id: string) {
    const img = uploadedImages.find((i) => i.id === id);
    if (img?.dbId && propertyId) {
      await fetch(`${BASE}/api/properties/${propertyId}/images/${img.dbId}/primary`, {
        method: "PUT",
        credentials: "include",
      }).catch(() => {});
    }
    setUploadedImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.id === id }))
    );
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function finishAndGoToListings() {
    if (uploadedImages.filter((img) => img.saved).length === 0) {
      toast({ title: "تنبيه", description: "لم تُضف أي صورة للإعلان. يمكنك إضافتها لاحقاً.", variant: "default" });
    } else {
      toast({ title: "تم بنجاح!", description: "تم إضافة إعلانك وسيُنشر بعد المراجعة." });
    }
    navigate("/dashboard/listings");
  }

  // ─── Step 2: Media Upload ───────────────────────────────────────────────────
  if (step === 2) {
    const savedCount = uploadedImages.filter((img) => img.saved).length;
    return (
      <DashboardLayout>
        <div dir="rtl" className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Camera className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">أضف الصور والفيديو</h1>
              <p style={{ fontSize: 15, color: "#0f172a" }}>الصور مهمة، والفيديو اختياري إذا كان متوفرًا</p>
            </div>
          </div>

          {/* Progress badge */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">✓</div>
            <span style={{ fontSize: 14, color: "#0f172a" }}>تم إنشاء الإعلان</span>
            <div className="flex-1 h-0.5 bg-border mx-1" />
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-xs font-bold">2</div>
            <span className="text-sm font-medium text-foreground">الصور والفيديو</span>
          </div>

          {/* Upload zone */}
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center mb-5 transition-colors cursor-pointer ${
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-primary/2"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-sm font-medium text-foreground">جارٍ رفع الصور...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ImagePlus className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">اسحب الصور هنا أو انقر للاختيار</p>
                  <p style={{ fontSize: 13, color: "#0f172a" }}>PNG, JPG, WEBP — حتى 10 صور</p>
                </div>
                <Button type="button" variant="outline" className="gap-2 mt-1">
                  <Upload className="h-4 w-4" />
                  اختر من الجهاز
                </Button>
              </div>
            )}
          </div>

          {/* Images grid */}
          {uploadedImages.length > 0 && (
            <div className="bg-card border rounded-2xl p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-foreground">{savedCount} صورة محفوظة</p>
                <p style={{ fontSize: 13, color: "#0f172a" }}>انقر النجمة لتعيين صورة رئيسية</p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {uploadedImages.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
                    <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />

                    {/* Saving overlay */}
                    {img.saving && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      </div>
                    )}

                    {/* Error overlay */}
                    {img.error && (
                      <div className="absolute inset-0 bg-red-900/70 flex flex-col items-center justify-center gap-1 p-1">
                        <AlertCircle className="h-5 w-5 text-white flex-shrink-0" />
                        <p className="text-white text-center leading-tight" style={{ fontSize: "9px" }}>{img.error}</p>
                        <button
                          onClick={() => removeImage(img.id)}
                          className="mt-0.5 text-red-200 underline"
                          style={{ fontSize: "9px" }}
                        >
                          إزالة
                        </button>
                      </div>
                    )}

                    {/* Saved controls */}
                    {img.saved && (
                      <>
                        <button
                          onClick={() => setPrimary(img.id)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-colors text-white"
                          style={{ background: img.isPrimary ? "#667EEA" : "rgba(0,0,0,0.4)" }}
                          title="تعيين كرئيسية"
                        >
                          <Star className="h-3.5 w-3.5 fill-current" />
                        </button>
                        <button
                          onClick={() => removeImage(img.id)}
                          className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        {img.isPrimary && (
                          <div className="absolute bottom-0 left-0 right-0 text-center text-xs font-bold py-0.5 text-white" style={{ background: "#667EEA" }}>
                            رئيسية
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional video */}
          <div className="bg-card border rounded-2xl p-4 mb-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">فيديو الإعلان <span style={{ color: "#64748b", fontWeight: 500 }}>(اختياري)</span></p>
                  <p style={{ fontSize: 12.5, color: "#64748b" }}>MP4, WEBM, MOV — حتى 50MB</p>
                </div>
              </div>
              {!uploadedVideo && (
                <Button type="button" variant="outline" className="gap-2" onClick={() => videoInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  اختر فيديو
                </Button>
              )}
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleVideoFile(file);
                e.currentTarget.value = "";
              }}
            />
            {uploadedVideo && (
              <div className="rounded-xl border overflow-hidden bg-muted">
                <div className="relative">
                  <video src={uploadedVideo.previewUrl} controls className="w-full max-h-72 bg-black" />
                  {uploadedVideo.saving && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-7 w-7 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <p className="text-sm" style={{ color: uploadedVideo.error ? "#dc2626" : "#0f172a" }}>
                    {/* The server re-encodes the clip so it plays on Android; that
                        takes ~15-30s, so say so rather than spin silently. */}
                    {uploadedVideo.error ??
                      (uploadedVideo.saving
                        ? "جارٍ معالجة الفيديو... قد يستغرق حتى دقيقة، لا تغلق الصفحة"
                        : uploadedVideo.saved
                          ? "تم حفظ الفيديو"
                          : "جاهز للحفظ")}
                  </p>
                  <Button type="button" variant="ghost" className="gap-2" onClick={removeVideo} disabled={uploadedVideo.saving}>
                    <Trash2 className="h-4 w-4" />
                    إزالة
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 gap-2"
              onClick={finishAndGoToListings}
              disabled={isUploading}
            >
              <CheckCircle className="h-4 w-4" />
              حفظ وإنهاء
            </Button>
            {uploadedImages.filter((img) => img.saved).length === 0 && (
              <Button
                variant="ghost"
                style={{ color: "#0f172a" }}
                onClick={finishAndGoToListings}
              >
                تخطّ لاحقاً
              </Button>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Step 1: Property Details Form ─────────────────────────────────────────
  return (
    <DashboardLayout>
      <div dir="rtl" className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/listings" style={{ color: "#0f172a" }}>
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">إضافة إعلان</h1>
            {user?.status === "pending" && (
              <p className="text-sm text-indigo-700 mt-0.5">سيُنشر إعلانك بعد تفعيل حسابك</p>
            )}
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-xs font-bold">1</div>
          <span className="text-sm font-medium text-foreground">تفاصيل الإعلان</span>
          <div className="flex-1 h-0.5 bg-border mx-1" />
          <div className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-border text-xs font-semibold" style={{ color: "#0f172a" }}>2</div>
          <span style={{ fontSize: 14, color: "#0f172a" }}>الصور</span>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="mb-5 p-4 bg-destructive/10 border border-destructive/20 rounded-xl" data-testid="listing-errors">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <ul className="text-sm text-destructive space-y-0.5">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Section: Search-like flow */}
          <div className="bg-card border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-lg text-foreground border-b pb-3">ابدأ مثل البحث عن عقار</h2>

            <div>
              <Label>نوع العرض <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {PROPERTY_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setStatus(s); setType(""); }}
                    className={`h-11 rounded-xl border text-sm font-bold transition-colors ${status === s ? "bg-primary text-white border-primary" : "bg-muted/60 text-foreground border-border hover:border-primary/40"}`}
                    disabled={submitting}
                    data-testid={`status-${s}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="mb-1 block">نوع العقار <span className="text-destructive">*</span></Label>
                <LocationCombobox
                  items={(TYPES_BY_STATUS[status] ?? []).map((t) => ({ value: t, label: t }))}
                  value={type}
                  onChange={setType}
                  placeholder={status ? "اختر نوع العقار" : "اختر نوع العرض أولاً"}
                  searchPlaceholder="ابحث عن نوع..."
                  emptyText="لا يوجد نوع بهذا الاسم"
                  disabled={!status}
                />
              </div>
              <div>
                <Label className="mb-1 block">المحافظة <span className="text-destructive">*</span></Label>
                <LocationCombobox
                  items={(govs ?? []).map((g: any) => ({
                    value: String(g.id),
                    label: g.nameAr.replace("محافظة ", ""),
                  }))}
                  value={governorateId}
                  onChange={(v) => { setGovernorateId(v); setAreaId(""); }}
                  placeholder="اختر المحافظة"
                  searchPlaceholder="ابحث..."
                  emptyText="لا توجد محافظة بهذا الاسم"
                />
              </div>
              <div>
                <Label className="mb-1 block">المنطقة <span className="text-destructive">*</span></Label>
                <LocationCombobox
                  items={(areas ?? []).map((a: any) => ({
                    value: String(a.id),
                    label: a.nameAr,
                  }))}
                  value={areaId}
                  onChange={setAreaId}
                  placeholder={governorateId ? "اختر المنطقة" : "اختر المحافظة أولاً"}
                  searchPlaceholder="ابحث..."
                  emptyText="لا توجد منطقة بهذا الاسم"
                  disabled={!governorateId}
                />
              </div>
            </div>
          </div>

          {/* Section: Price and optional specs */}
          <div className="bg-card border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-lg text-foreground border-b pb-3">السعر والمواصفات</h2>

            <div>
              <Label htmlFor="price">السعر <span className="text-destructive">*</span></Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="price"
                  type="number"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="flex-1"
                  min={0}
                  disabled={submitting}
                  data-testid="input-listing-price"
                />
                <div className="flex items-center px-4 bg-muted border border-input rounded-md text-sm font-semibold select-none" style={{ color: "#0f172a" }}>
                  KWD
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="areaSize">المساحة <span style={{ color: "#64748b", fontWeight: 500 }}>(اختياري)</span></Label>
                <Input id="areaSize" type="number" placeholder="م²" value={areaSize}
                  onChange={(e) => setAreaSize(e.target.value)} className="mt-1" min={0}
                  disabled={submitting} data-testid="input-listing-area" />
              </div>
              <div>
                <Label htmlFor="bedrooms">عدد الغرف <span style={{ color: "#64748b", fontWeight: 500 }}>(اختياري)</span></Label>
                <Input id="bedrooms" type="number" placeholder="0" value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)} className="mt-1" min={0}
                  disabled={submitting} data-testid="input-listing-bedrooms" />
              </div>
              <div>
                <Label htmlFor="bathrooms">عدد الحمامات <span style={{ color: "#64748b", fontWeight: 500 }}>(اختياري)</span></Label>
                <Input id="bathrooms" type="number" placeholder="0" value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)} className="mt-1" min={0}
                  disabled={submitting} data-testid="input-listing-bathrooms" />
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30">
              <button
                type="button"
                onClick={() => setShowExtras((v) => !v)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-right"
                disabled={submitting}
              >
                <span className="font-semibold text-foreground">خيارات إضافية <span style={{ color: "#64748b", fontWeight: 500 }}>(اختياري)</span></span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showExtras ? "rotate-180" : ""}`} />
              </button>

              {showExtras && (
                <div className="px-4 pb-4 space-y-4">
                  <div>
                    <Label className="mb-1 block">حالة التأثيث</Label>
                    <Select value={furnished || "none"} onValueChange={(v) => setFurnished(v === "none" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">غير محدد</SelectItem>
                        {furnishedOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 block">مميزات العقار</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {amenityOptions.map((option) => {
                        const active = amenities.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleAmenity(option)}
                            className={`min-h-10 rounded-lg border px-3 text-sm font-semibold transition-colors ${active ? "bg-primary/10 text-primary border-primary/40" : "bg-white text-foreground border-border hover:border-primary/40"}`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Content */}
          <div className="bg-card border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-lg text-foreground border-b pb-3">محتوى الإعلان</h2>

            <div>
              <Label htmlFor="titleAr">عنوان الإعلان <span className="text-destructive">*</span></Label>
              <Input
                id="titleAr"
                placeholder="مثال: شقة 3 غرف في السالمية"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                className="mt-1"
                disabled={submitting}
                data-testid="input-listing-title"
              />
            </div>

            <div>
              <Label htmlFor="descriptionAr">وصف الإعلان <span className="text-destructive">*</span></Label>
              <Textarea
                id="descriptionAr"
                placeholder="اكتب وصفاً واضحاً للإعلان..."
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                className="mt-1 resize-none"
                rows={5}
                disabled={submitting}
                data-testid="input-listing-description"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Link href="/dashboard/listings">
              <Button type="button" variant="outline" disabled={submitting}>إلغاء</Button>
            </Link>
            <Button type="submit" disabled={submitting} className="gap-2" data-testid="button-submit-listing">
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />جارٍ الإضافة...</>
              ) : "التالي: الصور والفيديو"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
