import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListGovernorates, useListAreas } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, CheckCircle, AlertCircle, ArrowRight,
  Star, ImagePlus, Upload, X
} from "lucide-react";
import { Link } from "wouter";
import { LocationCombobox } from "@/components/LocationCombobox";

const PROPERTY_STATUSES = ["للإيجار", "للبيع", "للبدل", "طلب"];
const TYPES_BY_STATUS: Record<string, string[]> = {
  "للإيجار": ["بيت", "قسيمة", "ارض", "دور", "شقة", "محل", "مكتب", "مخزن", "شاليه", "استراحة", "مزرعة", "عمارة", "مجمع", "قسيمة صناعية", "قسيمة حرفية"],
  "للبيع":   ["بيت", "قسيمة", "ارض", "دور", "شقة", "محل", "مكتب", "مخزن", "شاليه", "استراحة", "مزرعة", "عمارة", "مجمع", "قسيمة صناعية", "قسيمة حرفية"],
  "للبدل":   ["بيت", "ارض", "شقة"],
  "طلب":     ["بيت", "قسيمة", "ارض", "دور", "شقة", "محل", "مكتب", "مخزن", "شاليه", "استراحة", "مزرعة", "عمارة", "مجمع", "قسيمة صناعية", "قسيمة حرفية"],
};

import { getApiBase } from "@/lib/apiBase";
const BASE = getApiBase();
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

interface DbImage { id: number; url: string; isPrimary: boolean; sortOrder: number }

export default function DashboardEditListing() {
  const params = useParams<{ id: string }>();
  const propId = parseInt(params.id ?? "", 10);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [titleAr, setTitleAr] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState("");
  const [areaSize, setAreaSize] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [governorateId, setGovernorateId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [images, setImages] = useState<DbImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: govs } = useListGovernorates();
  const { data: areas } = useListAreas(
    { governorateId: governorateId ? Number(governorateId) : undefined } as any,
    { query: { enabled: !!governorateId } }
  );

  useEffect(() => {
    if (!propId) { setNotFound(true); setLoading(false); return; }
    fetch(`${BASE}/api/properties/${propId}`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) { setNotFound(true); return; }
        const p = await r.json() as {
          titleAr?: string; title?: string; status?: string; type?: string;
          price?: number; area?: number | null; bedrooms?: number | null;
          bathrooms?: number | null; governorateId?: number | null; areaId?: number | null;
          descriptionAr?: string | null; images?: DbImage[];
        };
        setTitleAr(p.titleAr ?? p.title ?? "");
        setStatus(p.status ?? "");
        setType(p.type ?? "");
        setPrice(p.price ? String(p.price) : "");
        setAreaSize(p.area ? String(p.area) : "");
        setBedrooms(p.bedrooms ? String(p.bedrooms) : "");
        setBathrooms(p.bathrooms ? String(p.bathrooms) : "");
        setGovernorateId(p.governorateId ? String(p.governorateId) : "");
        setAreaId(p.areaId ? String(p.areaId) : "");
        setDescriptionAr(p.descriptionAr ?? "");
        setImages(p.images ?? []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [propId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clientErrors: string[] = [];
    if (titleAr.trim().length < 5) clientErrors.push("العنوان يجب أن يكون 5 أحرف على الأقل");
    if (!status) clientErrors.push("يرجى اختيار نوع العرض");
    if (!type) clientErrors.push("يرجى اختيار نوع العقار");
    if (!price || Number(price) <= 0) clientErrors.push("يرجى إدخال سعر صحيح");
    if (!governorateId) clientErrors.push("يرجى اختيار المحافظة");
    if (!areaId) clientErrors.push("يرجى اختيار المنطقة");

    if (clientErrors.length > 0) { setErrors(clientErrors); return; }
    setErrors([]);
    setSubmitting(true);

    try {
      const res = await fetch(`${BASE}/api/properties/${propId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          titleAr: titleAr.trim(),
          status, type,
          price: Number(price),
          areaSize: areaSize ? Number(areaSize) : null,
          bedrooms: bedrooms ? Number(bedrooms) : null,
          bathrooms: bathrooms ? Number(bathrooms) : null,
          governorateId: governorateId ? Number(governorateId) : null,
          areaId: areaId ? Number(areaId) : null,
          descriptionAr: descriptionAr.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({})) as { error?: string; details?: string[] };
      if (!res.ok) {
        const errs = data.details ?? (data.error ? [data.error] : ["حدث خطأ في الخادم"]);
        setErrors(errs);
        return;
      }
      toast({ title: "تم تحديث الإعلان بنجاح" });
      navigate("/dashboard/listings");
    } catch {
      setErrors(["خطأ في الاتصال، تحقق من اتصالك وحاول مرة أخرى"]);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.has(file.type)) {
      toast({ title: "نوع الملف غير مدعوم", description: "JPG, PNG, WEBP فقط", variant: "destructive" });
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast({ title: "حجم الصورة كبير", description: "الحد الأقصى 5 ميغابايت", variant: "destructive" });
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const uploadRes = await fetch(`${BASE}/api/uploads/images`, {
        method: "POST", body: formData, credentials: "include",
      });
      if (!uploadRes.ok) {
        toast({ title: "فشل رفع الصورة", variant: "destructive" });
        return;
      }
      const { url } = await uploadRes.json() as { url: string };

      const isPrimary = images.length === 0;
      const saveRes = await fetch(`${BASE}/api/properties/${propId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url, isPrimary }),
      });

      if (!saveRes.ok) {
        toast({ title: "فشل حفظ الصورة", variant: "destructive" });
        return;
      }
      const { image } = await saveRes.json() as { image: DbImage };
      setImages((prev) => [...prev, image]);
      toast({ title: "تم رفع الصورة بنجاح" });
    } catch {
      toast({ title: "خطأ في الاتصال", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleDeleteImage(img: DbImage) {
    const res = await fetch(`${BASE}/api/properties/${propId}/images/${img.id}`, {
      method: "DELETE", credentials: "include",
    });
    if (!res.ok) { toast({ title: "فشل حذف الصورة", variant: "destructive" }); return; }
    setImages((prev) => {
      const updated = prev.filter((i) => i.id !== img.id);
      if (img.isPrimary && updated.length > 0) updated[0].isPrimary = true;
      return updated;
    });
  }

  async function handleSetPrimary(img: DbImage) {
    const res = await fetch(`${BASE}/api/properties/${propId}/images/${img.id}/primary`, {
      method: "PUT", credentials: "include",
    });
    if (!res.ok) { toast({ title: "فشل تعيين الصورة الرئيسية", variant: "destructive" }); return; }
    setImages((prev) => prev.map((i) => ({ ...i, isPrimary: i.id === img.id })));
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div dir="rtl" className="max-w-2xl mx-auto flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (notFound || !propId) {
    return (
      <DashboardLayout>
        <div dir="rtl" className="max-w-2xl mx-auto text-center py-24">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h2 className="text-xl font-bold mb-2">الإعلان غير موجود</h2>
          <Link href="/dashboard/listings">
            <Button variant="outline" className="gap-2 mt-3">
              <ArrowRight className="h-4 w-4" />العودة للإعلانات
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div dir="rtl" className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/listings" className="text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">تعديل الإعلان</h1>
        </div>

        {errors.length > 0 && (
          <div className="mb-5 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <ul className="text-sm text-destructive space-y-0.5">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="bg-card border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-lg text-foreground border-b pb-3">المعلومات الأساسية</h2>

            <div>
              <Label htmlFor="titleAr">عنوان الإعلان <span className="text-destructive">*</span></Label>
              <Input
                id="titleAr"
                placeholder="مثال: شقة 3 غرف في السالمية"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                className="mt-1"
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">نوع العرض <span className="text-destructive">*</span></Label>
                <Select value={status} onValueChange={(v) => { setStatus(v); setType(""); }}>
                  <SelectTrigger id="status" className="mt-1">
                    <SelectValue placeholder="اختر نوع العرض" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
            </div>

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
                />
                <div className="flex items-center px-4 bg-muted border border-input rounded-md text-sm font-semibold text-muted-foreground select-none">
                  KWD
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-lg text-foreground border-b pb-3">التفاصيل</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="areaSize">المساحة (م²)</Label>
                <Input id="areaSize" type="number" placeholder="0" value={areaSize}
                  onChange={(e) => setAreaSize(e.target.value)} className="mt-1" min={0} disabled={submitting} />
              </div>
              <div>
                <Label htmlFor="bedrooms">غرف النوم</Label>
                <Input id="bedrooms" type="number" placeholder="0" value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)} className="mt-1" min={0} disabled={submitting} />
              </div>
              <div>
                <Label htmlFor="bathrooms">دورات المياه</Label>
                <Input id="bathrooms" type="number" placeholder="0" value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)} className="mt-1" min={0} disabled={submitting} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">المحافظة <span className="text-destructive">*</span></Label>
                <LocationCombobox
                  items={(govs ?? []).map((g: any) => ({ value: String(g.id), label: g.nameAr.replace("محافظة ", "") }))}
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
                  items={(areas ?? []).map((a: any) => ({ value: String(a.id), label: a.nameAr }))}
                  value={areaId}
                  onChange={setAreaId}
                  placeholder={governorateId ? "اختر المنطقة" : "اختر المحافظة أولاً"}
                  searchPlaceholder="ابحث..."
                  emptyText="لا توجد منطقة بهذا الاسم"
                  disabled={!governorateId}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descriptionAr">وصف العقار</Label>
              <Textarea
                id="descriptionAr"
                placeholder="اكتب وصفاً تفصيلياً للعقار..."
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                className="mt-1 resize-none"
                rows={4}
                disabled={submitting}
              />
            </div>
          </div>

          {/* ─── Images Section ─── */}
          <div className="bg-card border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-semibold text-lg text-foreground">صور الإعلان</h2>
              <label
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: "1.5px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: uploadingImage ? "not-allowed" : "pointer", opacity: uploadingImage ? 0.6 : 1 }}
              >
                {uploadingImage ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
                إضافة صورة
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
            </div>

            {images.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
                <Upload className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">لا توجد صور بعد. أضف صورة للإعلان.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(img)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white transition-colors"
                      style={{ background: img.isPrimary ? "#667EEA" : "rgba(0,0,0,0.4)" }}
                      title="تعيين كرئيسية"
                    >
                      <Star size={12} className="fill-current" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img)}
                      className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                    {img.isPrimary && (
                      <div className="absolute bottom-0 left-0 right-0 text-center text-xs font-bold py-0.5 text-white" style={{ background: "#667EEA" }}>
                        رئيسية
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {submitting ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </Button>
            <Link href="/dashboard/listings">
              <Button type="button" variant="outline" className="gap-2">
                إلغاء
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
