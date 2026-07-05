import { useState } from "react";
import { useRoute } from "wouter";
import { useGetOffice, useGetOfficeProperties, getGetOfficeQueryKey } from "@workspace/api-client-react";
import MainLayout from "@/components/layout/MainLayout";
import { PropertyCard } from "@/components/PropertyCard";
import { LogoImg } from "@/components/LogoImg";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, MessageCircle, Globe, Instagram, Twitter, MapPin } from "lucide-react";

function stripGovPrefix(name: string) {
  return name.replace(/^محافظة\s*/, "");
}

export default function OfficeDetail() {
  const [, params] = useRoute("/offices/:id");
  const id = parseInt(params?.id ?? "0");
  const [propPage, setPropPage] = useState(1);

  const { data: office, isLoading } = useGetOffice(id, {
    query: { enabled: !!id, queryKey: getGetOfficeQueryKey(id) },
  });
  const { data: propertiesData } = useGetOfficeProperties(id, { page: propPage, limit: 8 } as any, {
    query: { enabled: !!id },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div dir="rtl" className="container mx-auto px-4 py-10 space-y-6">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </MainLayout>
    );
  }

  if (!office) {
    return (
      <MainLayout>
        <div dir="rtl" className="container mx-auto px-4 py-24 text-center text-muted-foreground">
          <p className="text-2xl">المكتب غير موجود</p>
        </div>
      </MainLayout>
    );
  }

  const properties = propertiesData?.properties ?? [];
  const totalPages = propertiesData?.totalPages ?? 1;
  const govName = office.governorateName ? stripGovPrefix(office.governorateName) : null;

  return (
    <MainLayout>
      {/* Cover */}
      <div className="relative h-48 md:h-64 bg-gradient-to-l from-primary to-primary/70 overflow-hidden">
        {office.coverImage && (
          <img src={office.coverImage} alt="cover" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
      </div>

      <div dir="rtl" className="container mx-auto px-4">
        {/* Office header */}
        <div className="flex flex-col md:flex-row gap-5 -mt-12 mb-8">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-background bg-card flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0">
            <LogoImg
              src={office.logo}
              alt={office.nameAr}
              className="w-full h-full object-cover"
              fallback={<span className="text-3xl font-black text-primary">{office.nameAr.charAt(0)}</span>}
            />
          </div>
          <div className="mt-12 md:mt-8 flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-1">{office.nameAr}</h1>
            {govName && (
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{govName}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4 md:mt-auto flex-wrap">
            {office.whatsapp && (
              <Button
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white font-bold px-6"
                onClick={() => window.open(`https://wa.me/${office.whatsapp}`, "_blank")}
                data-testid="button-office-whatsapp"
              >
                <MessageCircle className="h-5 w-5 ml-2" />
                تواصل عبر واتساب
              </Button>
            )}
            {office.phone && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.open(`tel:${office.phone}`, "_blank")}
                data-testid="button-office-call"
              >
                <Phone className="h-4 w-4 ml-2" />
                اتصال مباشر
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main: Description + Properties */}
          <div className="lg:col-span-2 space-y-6">
            {office.descriptionAr && (
              <div className="bg-card border rounded-2xl p-6">
                <h2 className="font-bold text-lg mb-3">عن المكتب</h2>
                <p className="text-muted-foreground leading-relaxed">{office.descriptionAr}</p>
              </div>
            )}

            {/* Properties */}
            <div>
              <h2 className="font-bold text-xl mb-5">عقارات المكتب</h2>
              {properties.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-card border rounded-2xl">
                  <p>لا توجد عقارات حالياً</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {properties.map((p) => (
                      <PropertyCard key={p.id} property={p} />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                      <Button variant="outline" disabled={propPage <= 1} onClick={() => setPropPage(propPage - 1)}>السابق</Button>
                      <span className="px-4 py-2 text-sm text-muted-foreground">{propPage} / {totalPages}</span>
                      <Button variant="outline" disabled={propPage >= totalPages} onClick={() => setPropPage(propPage + 1)}>التالي</Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sidebar: Contact info */}
          <div className="space-y-5">
            <div className="bg-card border rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-lg border-b pb-3">معلومات التواصل</h3>
              {office.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a href={office.website} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">{office.website}</a>
                </div>
              )}
              {office.instagram && (
                <div className="flex items-center gap-2 text-sm">
                  <Instagram className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a href={`https://instagram.com/${office.instagram}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">@{office.instagram}</a>
                </div>
              )}
              {office.twitter && (
                <div className="flex items-center gap-2 text-sm">
                  <Twitter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a href={`https://twitter.com/${office.twitter}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">@{office.twitter}</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
