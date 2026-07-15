import MainLayout from "@/components/layout/MainLayout";
import { Link } from "wouter";
import { ShieldAlert, ArrowRight } from "lucide-react";

const SECTIONS = [
  {
    title: "١. دور المنصة",
    content:
      "Finde هي منصة وسيطة تتيح للمكاتب العقارية المعتمدة عرض عقاراتها للباحثين. دور المنصة يقتصر على تسهيل التواصل، ولا تُعدّ طرفاً في أي اتفاق أو عقد يُبرم بين المكتب العقاري والعميل.",
  },
  {
    title: "٢. دقة المعلومات",
    content:
      "جميع المعلومات المعروضة على المنصة مقدمة من المكاتب العقارية المسجلة. تبذل المنصة جهودها للتحقق من صحة البيانات، إلا أنها لا تضمن دقة أو اكتمال أي معلومة بشكل مطلق.",
  },
  {
    title: "٣. المسؤولية عن الصفقات",
    content:
      "المنصة غير مسؤولة عن أي صفقة أو تعامل مالي أو قانوني ينشأ بين الأطراف. ننصح المستخدمين بالتحقق الكامل من تفاصيل العقار والمكتب قبل إتمام أي اتفاق.",
  },
  {
    title: "٤. الروابط الخارجية",
    content:
      "قد تحتوي المنصة على روابط لمواقع أو خدمات خارجية. لا تتحمل Finde أي مسؤولية عن محتوى هذه المواقع أو ممارساتها.",
  },
  {
    title: "٥. التغييرات في الخدمة",
    content:
      "تحتفظ المنصة بحق تعديل أو إيقاف أي جزء من خدماتها في أي وقت دون إشعار مسبق، وذلك وفق ما تراه مناسباً لضمان جودة الخدمة.",
  },
  {
    title: "٦. الاستخدام على مسؤوليتك",
    content:
      "استخدامك للمنصة يتم على مسؤوليتك الشخصية. لا تتحمل المنصة أي أضرار مباشرة أو غير مباشرة قد تنجم عن استخدامك للمعلومات المعروضة.",
  },
];

export default function Disclaimer() {
  return (
    <MainLayout>
      <div dir="rtl" className="min-h-screen bg-white">
        <div className="bg-[#0b1220] text-white py-14 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 ring-1 ring-white/15 shadow-lg flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-black mb-2 text-white">إخلاء المسؤولية</h1>
            <p className="inline-block rounded-full bg-white/10 ring-1 ring-white/15 px-3 py-1 text-xs text-white/65">
              آخر تحديث: 1 يناير 2026
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-[hsl(221,54%,98%)] border border-[hsl(221,54%,90%)] rounded-2xl p-5 mb-8 text-sm text-[hsl(221,54%,30%)]">
            جميع العقارات المعروضة مقدمة من مكاتب عقارية مستقلة، والمنصة لا تتدخل في أي اتفاق يتم بين الأطراف ولا تتحمل أي مسؤولية قانونية أو مالية عنه.
          </div>

          <div className="space-y-8">
            {SECTIONS.map((s) => (
              <div key={s.title}>
                <h2 className="text-base font-bold text-[hsl(221,54%,23%)] mb-2">{s.title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-[#667EEA] px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#5568d8] hover:shadow-md"
            >
              <ArrowRight className="h-4 w-4" />
              العودة إلى صفحة التسجيل
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
