import MainLayout from "@/components/layout/MainLayout";
import { Lock } from "lucide-react";

const SECTIONS = [
  {
    title: "١. المعلومات التي نجمعها",
    content:
      "نجمع المعلومات التي تقدمها مباشرةً عند التسجيل، مثل الاسم ورقم الهاتف والبريد الإلكتروني، إضافةً إلى بيانات الاستخدام التلقائية كالصفحات التي تزورها وطريقة تفاعلك مع المنصة.",
  },
  {
    title: "٢. كيف نستخدم بياناتك",
    content:
      "نستخدم بياناتك فقط لتشغيل المنصة وتحسين تجربتك، ولإرسال إشعارات تتعلق بحسابك أو عقاراتك. لا نبيع بياناتك لأي طرف ثالث ولا نشاركها إلا عند الضرورة القانونية.",
  },
  {
    title: "٣. حماية البيانات",
    content:
      "نحرص على تطبيق معايير الحماية التقنية المناسبة للحفاظ على أمان بياناتك. يتم تخزين كلمات المرور بصورة مشفرة ولا يمكن لأي موظف الاطلاع عليها.",
  },
  {
    title: "٤. ملفات تعريف الارتباط (Cookies)",
    content:
      "تستخدم المنصة ملفات الارتباط لتحسين تجربة التصفح والحفاظ على جلسة تسجيل الدخول. يمكنك التحكم في إعدادات ملفات الارتباط من خلال متصفحك.",
  },
  {
    title: "٥. الاحتفاظ بالبيانات",
    content:
      "نحتفظ ببياناتك طالما حسابك نشط. عند حذف الحساب، يتم حذف البيانات الشخصية خلال 30 يوم عمل، مع الاحتفاظ بما يلزم قانونياً.",
  },
  {
    title: "٦. حقوقك",
    content:
      "يحق لك طلب الاطلاع على بياناتك، أو تصحيحها، أو طلب حذفها في أي وقت، وذلك بالتواصل معنا عبر القنوات المتاحة.",
  },
  {
    title: "٧. تعديل سياسة الخصوصية",
    content:
      "قد نحدّث هذه السياسة من وقت لآخر. سنُخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل المنصة.",
  },
];

export default function Privacy() {
  return (
    <MainLayout>
      <div dir="rtl" className="min-h-screen bg-white">
        <div className="bg-[#0b1220] text-white py-14 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 ring-1 ring-white/15 shadow-lg flex items-center justify-center mx-auto mb-4">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-black mb-2 text-white">سياسة الخصوصية</h1>
            <p className="text-white/70 text-sm">آخر تحديث: يناير 2025</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-[hsl(221,54%,98%)] border border-[hsl(221,54%,90%)] rounded-2xl p-5 mb-8 text-sm text-[hsl(221,54%,30%)]">
            نحن نحترم خصوصيتك ونحافظ على بياناتك ونستخدمها فقط لتحسين تجربة المستخدم داخل المنصة. يرجى قراءة هذه السياسة لفهم كيفية التعامل مع معلوماتك الشخصية.
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
