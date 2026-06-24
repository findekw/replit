import { useState, useEffect } from "react";
import { useGetOffice } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, ExternalLink, Save } from "lucide-react";
import { useOfficeAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { getApiBase } from "@/lib/apiBase";
const BASE = getApiBase();

type TemplateKey = "modern" | "luxury" | "minimal" | "classic";

interface TemplateMeta {
  key: TemplateKey;
  name: string;
  description: string;
  heroBg: string;
  accent: string;
  accentContrast: string;
  logoDot: string;
  lineColor: string;
}

const TEMPLATES: TemplateMeta[] = [
  {
    key: "modern",
    name: "مودرن",
    description: "تصميم عصري جريء بواجهة متدرّجة وبطاقة تواصل بارزة — الأكثر شيوعًا.",
    heroBg: "linear-gradient(135deg,#16203a 0%,#243056 45%,#3F5BD8 120%)",
    accent: "#3F5BD8",
    accentContrast: "#ffffff",
    logoDot: "#ffffff",
    lineColor: "rgba(255,255,255,0.55)",
  },
  {
    key: "luxury",
    name: "فخم",
    description: "خلفية داكنة ولمسات ذهبية بأسلوب تحريري راقٍ — للمكاتب المميّزة.",
    heroBg: "linear-gradient(160deg,#0B0F1A 0%,#16203a 100%)",
    accent: "#C9A227",
    accentContrast: "#1F2A44",
    logoDot: "#C9A227",
    lineColor: "rgba(255,255,255,0.4)",
  },
  {
    key: "minimal",
    name: "مينيمال",
    description: "أبيض نظيف وتصميم تيبوغرافي بسيط بلمسة خضراء — أنيق وهادئ.",
    heroBg: "#FFFFFF",
    accent: "#0E9F6E",
    accentContrast: "#ffffff",
    logoDot: "#0F172A",
    lineColor: "#CBD5E1",
  },
  {
    key: "classic",
    name: "كلاسيك",
    description: "تصميم مؤسسي بعمودين ولوحة تواصل جانبية — موثوق ومنظّم.",
    heroBg: "linear-gradient(180deg,#1F2A44 0%,#1F2A44 70%,#3F5BD8 70%,#3F5BD8 100%)",
    accent: "#3F5BD8",
    accentContrast: "#ffffff",
    logoDot: "#ffffff",
    lineColor: "rgba(255,255,255,0.55)",
  },
];

function resolveTemplate(t: unknown): TemplateKey {
  if (t === "dark") return "luxury";
  if (t === "luxury" || t === "minimal" || t === "classic") return t;
  return "modern";
}

/* Mini visual preview of a theme's hero */
function TemplatePreview({ tpl }: { tpl: TemplateMeta }) {
  const isMinimal = tpl.key === "minimal";
  return (
    <div
      style={{
        height: 120,
        borderRadius: 12,
        background: tpl.heroBg,
        border: isMinimal ? "1px solid #E2E8F0" : "none",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 7,
            background: tpl.logoDot,
            flexShrink: 0,
            border: isMinimal ? "1px solid #E2E8F0" : "none",
          }}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ height: 6, width: "70%", borderRadius: 4, background: tpl.lineColor }} />
          <div style={{ height: 5, width: "45%", borderRadius: 4, background: tpl.lineColor }} />
        </div>
      </div>
      <div
        style={{
          alignSelf: "flex-start",
          height: 22,
          padding: "0 14px",
          borderRadius: 8,
          background: tpl.accent,
          color: tpl.accentContrast,
          fontSize: 11,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
        }}
      >
        تواصل
      </div>
    </div>
  );
}

export default function DashboardLanding() {
  const { officeId: oid } = useOfficeAuth();
  const officeId = oid ?? 0;
  const { toast } = useToast();

  const { data: office, isLoading, refetch } = useGetOffice(officeId, {
    query: { enabled: officeId > 0 },
  } as any);

  const [selected, setSelected] = useState<TemplateKey>("modern");
  const [saving, setSaving] = useState(false);

  const currentTemplate = resolveTemplate((office as any)?.landingTemplate);
  const slug = (office as any)?.slug as string | undefined;

  // Pre-select the office's current template once loaded
  useEffect(() => {
    if (office) setSelected(currentTemplate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [office]);

  async function handleSave() {
    if (officeId <= 0) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/offices/${officeId}/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landingTemplate: selected }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({
          title: "فشل الحفظ",
          description: (data as any).error ?? "حدث خطأ غير متوقع",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "تم حفظ القالب", description: "تم تحديث شكل صفحتك العامة." });
      await refetch();
    } catch {
      toast({
        title: "خطأ في الاتصال",
        description: "تحقق من اتصالك وحاول مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <div dir="rtl">
        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1F2A44", margin: 0 }}>
            قالب صفحة الهبوط
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: "6px 0 0" }}>
            اختر شكل صفحتك العامة اللي بتظهر لعملائك.
          </p>
        </div>

        {/* Cards */}
        {isLoading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 18,
            }}
          >
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div
            className="dl-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 18,
            }}
          >
            <style>{`@media (max-width: 768px){ .dl-grid{ grid-template-columns: 1fr !important; } }`}</style>
            {TEMPLATES.map((tpl) => {
              const isSelected = selected === tpl.key;
              return (
                <button
                  key={tpl.key}
                  type="button"
                  onClick={() => setSelected(tpl.key)}
                  data-testid={`template-${tpl.key}`}
                  style={{
                    position: "relative",
                    textAlign: "start",
                    cursor: "pointer",
                    background: "#fff",
                    border: isSelected ? "2px solid #3F5BD8" : "1px solid #EEF1F5",
                    borderRadius: 18,
                    boxShadow: isSelected
                      ? "0 0 0 3px rgba(63,91,216,0.18), 0 6px 20px rgba(15,23,42,0.06)"
                      : "0 6px 20px rgba(15,23,42,0.06)",
                    padding: 16,
                    fontFamily: "'Cairo', sans-serif",
                    transition: "border-color .15s, box-shadow .15s",
                  }}
                >
                  {isSelected && (
                    <span
                      style={{
                        position: "absolute",
                        top: 12,
                        insetInlineStart: 12,
                        width: 26,
                        height: 26,
                        borderRadius: 999,
                        background: "#3F5BD8",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(63,91,216,0.4)",
                        zIndex: 2,
                      }}
                    >
                      <Check style={{ width: 16, height: 16 }} />
                    </span>
                  )}
                  <TemplatePreview tpl={tpl} />
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#1F2A44" }}>
                      {tpl.name}
                      {tpl.key === currentTemplate && (
                        <span
                          style={{
                            marginInlineStart: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#0E9F6E",
                            background: "#ECFDF5",
                            border: "1px solid #A7F3D0",
                            padding: "2px 8px",
                            borderRadius: 999,
                          }}
                        >
                          الحالي
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: "#64748B", margin: "6px 0 0", lineHeight: 1.6 }}>
                      {tpl.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 26 }}>
          <Button
            onClick={handleSave}
            disabled={saving || isLoading || officeId <= 0}
            className="gap-2 h-11 px-6 rounded-xl font-bold"
            style={{ background: "#3F5BD8" }}
            data-testid="button-save-template"
          >
            <Save className="h-4 w-4" />
            {saving ? "جارٍ الحفظ…" : "حفظ القالب"}
          </Button>
          {slug && (
            <Button
              variant="outline"
              onClick={() => window.open(`/${slug}`, "_blank")}
              className="gap-2 h-11 px-6 rounded-xl font-bold"
              data-testid="button-preview-page"
            >
              <ExternalLink className="h-4 w-4" />
              معاينة صفحتي
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
