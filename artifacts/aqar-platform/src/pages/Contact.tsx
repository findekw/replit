import MainLayout from "@/components/layout/MainLayout";
import { Mail, Instagram } from "lucide-react";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.855L.054 23.446a.5.5 0 0 0 .614.614l5.595-1.48A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.9 9.9 0 0 1-5.031-1.373l-.36-.214-3.733.987.997-3.63-.234-.374A9.86 9.86 0 0 1 2.1 12C2.1 6.534 6.534 2.1 12 2.1c5.467 0 9.9 4.434 9.9 9.9 0 5.467-4.433 9.9-9.9 9.9z"/>
  </svg>
);

const WHATSAPP = "96595005151";
const WHATSAPP_MSG = encodeURIComponent("مرحباً، أودّ الاستفسار عن منصة فايند العقارية.");

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function Contact() {
  return (
    <MainLayout>
      <div dir="rtl" className="bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-gray-900 mb-2">اتصل بنا</h1>
            <p className="text-gray-500 text-base">
              يسعدنا دائماً تواصلكم معنا عبر أي من القنوات التالية:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-indigo-600" />
              </div>
              <h2 className="font-bold text-gray-900 text-base mb-1">البريد الإلكتروني</h2>
              <p className="text-gray-500 text-sm mb-4">راسلنا وسنرد عليك في أقرب وقت</p>
              <a
                href="mailto:info@finde.co"
                className="text-sm font-semibold text-indigo-600 hover:underline break-all"
              >
                info@finde.co
              </a>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                <WhatsAppIcon className="h-6 w-6 text-green-500" />
              </div>
              <h2 className="font-bold text-gray-900 text-base mb-1">واتساب</h2>
              <p className="text-gray-500 text-sm mb-4">تواصل معنا مباشرةً للردّ السريع</p>
              <a
                href={`https://wa.me/${WHATSAPP}?text=${WHATSAPP_MSG}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: "#25D366" }}
              >
                <WhatsAppIcon className="h-4 w-4" />
                ابدأ المحادثة
              </a>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                <Instagram className="h-6 w-6 text-gray-700" />
              </div>
              <h2 className="font-bold text-gray-900 text-base mb-1">مواقع التواصل الاجتماعي</h2>
              <p className="text-gray-500 text-sm mb-4">تابعنا وتواصل معنا عبر حساباتنا الرسمية</p>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.instagram.com/finde.kw?utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: "#E1306C" }}
                >
                  <Instagram className="h-4 w-4" />
                  إنستقرام
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
