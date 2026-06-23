import MainLayout from "@/components/layout/MainLayout";
import { ShieldAlert } from "lucide-react";

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
        <div className="bg-[hsl(221,54%,23%)] text-white py-14 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-black mb-2">إخلاء المسؤولية</h1>
            <p className="text-white/70 text-sm">آخر تحديث: يناير 2025</p>
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
        </div>
      </div>
    </MainLayout>
  );
}
