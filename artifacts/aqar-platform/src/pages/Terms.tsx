import MainLayout from "@/components/layout/MainLayout";
import { Link } from "wouter";
import { FileText, ArrowRight } from "lucide-react";

const SECTIONS = [
  {
    title: "١. قبول الشروط",
    content:
      "باستخدامك منصة Finde أو التسجيل فيها، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، فيرجى عدم استخدام المنصة.",
  },
  {
    title: "٢. وصف الخدمة",
    content:
      "Finde هي منصة إلكترونية تتيح للمكاتب العقارية المعتمدة في الكويت نشر إعلاناتهم العقارية، وتتيح للباحثين عن العقارات الاطلاع عليها والتواصل مع المكاتب مباشرةً.",
  },
  {
    title: "٣. شروط التسجيل",
    content:
      "يجب أن تكون المعلومات المقدمة عند التسجيل صحيحة ودقيقة وكاملة. أنت مسؤول عن الحفاظ على سرية بيانات حسابك وكلمة المرور. لا يُسمح بإنشاء أكثر من حساب واحد لكل مكتب.",
  },
  {
    title: "٤. إعلانات المكاتب العقارية",
    content:
      "يلتزم أصحاب المكاتب بنشر معلومات صحيحة وغير مضللة. يحق للمنصة حذف أو إخفاء أي إعلان يخالف معايير الاستخدام أو يحتوي على معلومات مزيفة. تبقى المسؤولية القانونية عن محتوى الإعلان على عاتق صاحب المكتب.",
  },
  {
    title: "٥. الاشتراكات والمدفوعات",
    content:
      "تتوفر تجربة مجانية لمدة 14 يومًا عند التسجيل في المنصة. بعد انتهاء التجربة، يلزم الاشتراك في إحدى الباقات المتاحة لمواصلة نشر الإعلانات. المدفوعات غير قابلة للاسترداد إلا في حالات استثنائية يقدرها فريق المنصة.",
  },
  {
    title: "٦. حقوق الملكية الفكرية",
    content:
      "جميع حقوق الملكية الفكرية المتعلقة بالمنصة وتصميمها وشعارها محفوظة لمنصة Finde. لا يجوز نسخ أي محتوى من المنصة أو إعادة استخدامه دون إذن كتابي مسبق.",
  },
  {
    title: "٧. إخلاء المسؤولية",
    content:
      "المنصة وسيط بين المكاتب العقارية والباحثين عن العقارات، ولا تتحمل مسؤولية أي صفقة أو تعامل ينشأ بين الطرفين. ننصح المستخدمين بالتحقق من المعلومات قبل اتخاذ أي قرار عقاري.",
  },
  {
    title: "٨. تعديل الشروط",
    content:
      "تحتفظ المنصة بحق تعديل هذه الشروط في أي وقت. سيتم إشعار المستخدمين المسجلين بأي تغييرات جوهرية. الاستمرار في استخدام المنصة بعد التعديل يُعد قبولاً للشروط الجديدة.",
  },
  {
    title: "٩. التواصل",
    content:
      "لأي استفسار بشأن هذه الشروط، يمكنك التواصل معنا عبر واتساب على الرقم 96595005151.",
  },
];

export default function Terms() {
  return (
    <MainLayout>
      <div dir="rtl" className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-[#0b1220] text-white py-14 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 ring-1 ring-white/15 shadow-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-black mb-2 text-white">الشروط والأحكام</h1>
            <p className="text-white/70 text-sm">آخر تحديث: يناير 2025</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-[hsl(221,54%,98%)] border border-[hsl(221,54%,90%)] rounded-2xl p-5 mb-8 text-sm text-[hsl(221,54%,30%)]">
            يرجى قراءة هذه الشروط بعناية قبل استخدام منصة Finde أو التسجيل فيها. تُشكّل هذه الشروط اتفاقية قانونية بينك وبين المنصة.
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
