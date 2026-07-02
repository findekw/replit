import { Link } from "wouter";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Building2, Search } from "lucide-react";

export default function Offices() {
  return (
    <MainLayout>
      <div dir="rtl" style={{ background: "#F5F7FA", minHeight: "100vh", fontFamily: "'Cairo', sans-serif" }}>
        <div className="container mx-auto px-4" style={{ maxWidth: 720, paddingTop: 96, paddingBottom: 96 }}>
          <div
            className="bg-white border text-center"
            style={{
              borderColor: "#E8EDF2",
              borderRadius: 18,
              padding: "44px 24px",
              boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                margin: "0 auto 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#EEF2FF",
                color: "#667EEA",
              }}
            >
              <Building2 size={34} />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#111827", margin: "0 0 10px" }}>
              صفحات المكاتب متاحة عبر روابطها الخاصة
            </h1>
            <p style={{ color: "#64748B", lineHeight: 1.9, margin: "0 auto 26px", maxWidth: 520 }}>
              ابحث عن العقار المطلوب، ومن صفحة الإعلان يمكنك فتح صفحة المكتب وعرض كل عقاراته مع فلتر البيع والإيجار والبدل.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/properties">
                <Button className="gap-2">
                  <Search size={17} />
                  تصفّح العقارات
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="gap-2">
                  <Building2 size={17} />
                  أضف مكتبك
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
