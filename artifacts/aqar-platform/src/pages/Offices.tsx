import { useState } from "react";
import { useListOffices } from "@workspace/api-client-react";
import MainLayout from "@/components/layout/MainLayout";
import { OfficeCard } from "@/components/OfficeCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Offices() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListOffices({ page, limit: 12 } as Record<string, string>);

  const offices = data?.offices ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <MainLayout>
      <div style={{ background: "#F5F7FA", minHeight: "100vh" }}>
      <div dir="rtl" className="container mx-auto px-4 py-10">
        {/* Header band */}
        <div
          className="rounded-2xl px-6 py-12 sm:py-14 mb-10 text-center"
          style={{
            background: "linear-gradient(135deg, #111827, #667EEA)",
            boxShadow: "0 6px 20px rgba(15,23,42,0.06)",
          }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            المكاتب العقارية
          </h1>
          <p className="text-base sm:text-lg text-white/80">
            تصفّح المكاتب الموثوقة في الكويت
          </p>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : offices.length === 0 ? (
          <div
            className="text-center py-20 rounded-2xl bg-white"
            style={{ boxShadow: "0 6px 20px rgba(15,23,42,0.06)" }}
          >
            <p className="text-xl font-semibold" style={{ color: "#111827" }}>
              لا توجد مكاتب
            </p>
            <p className="mt-2 text-sm" style={{ color: "#64748B" }}>
              لم نعثر على أي مكاتب عقارية حالياً
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {offices.map((office) => (
                <OfficeCard key={office.id} office={office} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>السابق</Button>
                <span className="px-4 py-2 text-sm text-muted-foreground">{page} / {totalPages}</span>
                <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>التالي</Button>
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </MainLayout>
  );
}
