import { useLocation } from "wouter";
import MainLayout from "@/components/layout/MainLayout";
import { useOfficeAuth } from "@/lib/AuthContext";
import { MessageCircle, Shield } from "lucide-react";

const BLUE     = "#1F2A44";
const ACCENT   = "#3F5BD8";
const WA_GREEN = "#25D366";

const FEATURE_CARDS = [
  { emoji: "🔗", title: "رابط خاص لمكتبك",   desc: "شارك جميع عقاراتك برابط واحد في واتساب وإنستغرام والبزنس كارد" },
  { emoji: "🏢", title: "صفحة خاصة لمكتبك",  desc: "مكتبك يحصل على صفحة داخل المنصة تعرض جميع عقاراته بشكل منظم" },
  { emoji: "📂", title: "إدارة العقارات",     desc: "أضف وعدّل عقاراتك بسهولة من لوحة تحكم واحدة" },
  { emoji: "📋", title: "30 إعلان نشط",       desc: "لديك حتى 30 إعلان مع حرية التعديل والحذف في أي وقت" },
  { emoji: "👁️", title: "عرض مستمر",          desc: "عقاراتك تظهر داخل المنصة للباحثين بشكل يومي" },
  { emoji: "💬", title: "تواصل مباشر",        desc: "استقبل العملاء مباشرة عبر واتساب بدون تعقيد" },
  { emoji: "👥", title: "العملاء المهتمون",   desc: "تابع جميع العملاء المهتمين بعقاراتك من مكان واحد" },
  { emoji: "📊", title: "متابعة الأداء",      desc: "اعرف عدد المشاهدات والتفاعل على عقاراتك بسهولة" },
];

export default function Plans() {
  const { officeId } = useOfficeAuth();
  const [, navigate] = useLocation();

  function handleCTA() {
    if (officeId) {
      navigate("/dashboard");
    } else {
      navigate("/register");
    }
  }

  return (
    <MainLayout>
      <div dir="rtl" className="min-h-screen" style={{ background: "#F5F7FA" }}>

        <style>{`
          body { background: #F5F7FA !important; }
          /* ── Features section ── */
          .features-section {
            background: #F5F7FA;
            padding: 10px 20px 24px;
            text-align: center;
          }
          .features-title {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 40px;
            color: var(--text-heading);
          }
          .feat-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            max-width: 1100px;
            margin: 0 auto;
          }
          @media (max-width: 1024px) {
            .feat-grid { grid-template-columns: repeat(3, 1fr); }
          }
          @media (max-width: 768px) {
            .feat-grid { grid-template-columns: repeat(2, 1fr); }
            .features-title { font-size: 22px; }
          }
          @media (max-width: 480px) {
            .feat-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          }
          .feat-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 26px 16px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0;
            transition: none;
          }
          .feat-card:hover { transform: none; box-shadow: none; }
          .feat-emoji { font-size: 30px; margin-bottom: 10px; }
          .feat-title {
            font-size: 16px; font-weight: 800; color: var(--text-heading);
            margin: 0 0 8px; letter-spacing: -0.2px; line-height: 1.3;
          }
          .feat-desc {
            font-size: 15px; color: #0f172a; font-weight: 500;
            margin: 0; line-height: 1.7;
          }
          @media (max-width: 768px) {
            .feat-card { padding: 20px 12px; }
            .feat-title { font-size: 15px; }
            .feat-desc  { font-size: 14px; color: #0f172a; line-height: 1.7; }
          }
          @media (max-width: 480px) {
            .feat-card { padding: 18px 10px; }
            .feat-title { font-size: 15px; }
            .feat-desc  { font-size: 14px; color: #0f172a; line-height: 1.7; }
          }
          @media (max-width: 768px) {
            .plans-hero-title { font-size: 26px !important; line-height: 1.4 !important; }
          }
          /* ── Pricing card ── */
          .pricing-card {
            background: #ffffff;
            border-radius: 18px;
            padding: 28px 20px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.05);
            text-align: center;
            max-width: 420px;
            margin: auto;
            border: 1px solid #e5e7eb;
          }
          .pricing-card h2 { font-size: 22px; font-weight: 800; color: var(--text-heading); margin-bottom: 8px; }
          .price-old { text-decoration: line-through; color: #0f172a; font-size: 17px; font-weight: 600; margin-bottom: 4px; opacity: 0.45; }
          .price-new { font-size: 30px; font-weight: 900; color: var(--text-heading); margin: 4px 0 10px; line-height: 1.2; }
          .price-new span { font-size: 16px; font-weight: 600; color: #0f172a; }
          .pricing-desc { font-size: 15px; color: #0f172a; margin: 10px 0; font-weight: 500; }
          .trial-line { font-size: 15px; font-weight: 800; color: var(--cta-color); margin: 14px 0 10px; }
          .cta-btn {
            background: var(--cta-color);
            color: #ffffff;
            border: none;
            padding: 14px;
            width: 100%;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: opacity 0.2s;
            margin-top: 6px;
          }
          .cta-btn {
            animation: pulseCTA 2.5s infinite;
          }
          .cta-btn:hover {
            animation: none;
            transform: scale(1.05);
            opacity: 0.9;
          }
          @keyframes pulseCTA {
            0%   { transform: scale(1);    box-shadow: 0 0 0 0   rgba(0,102,255,0.4); }
            50%  { transform: scale(1.04); box-shadow: 0 0 0 10px rgba(0,102,255,0);   }
            100% { transform: scale(1);    box-shadow: 0 0 0 0   rgba(0,102,255,0);    }
          }
          @media (max-width: 768px) {
            .cta-btn { animation: pulseCTA 3s infinite; }
            @keyframes pulseCTA {
              0%   { transform: scale(1);    box-shadow: 0 0 0 0  rgba(0,102,255,0.3); }
              50%  { transform: scale(1.02); box-shadow: 0 0 0 8px rgba(0,102,255,0);  }
              100% { transform: scale(1);    box-shadow: 0 0 0 0  rgba(0,102,255,0);   }
            }
          }
          @media (max-width: 768px) {
            .pricing-card { padding: 22px 15px; }
            .pricing-card h2 { font-size: 20px; }
            .price-new { font-size: 30px; }
            .cta-btn { font-size: 15px; padding: 12px; }
          }
          /* ── Pricing section spacing ── */
          .pricing-section {
            margin-top: 10px !important;
            padding-top: 10px !important;
          }
          @media (max-width: 768px) {
            .pricing-section {
              margin-top: 6px !important;
              padding-top: 6px !important;
            }
          }
          @media (min-width: 1200px) {
            .pricing-section {
              margin-top: 16px !important;
              padding-top: 10px !important;
            }
          }
        `}</style>

        {/* ── 1. Hero ── */}
        <div className="text-center pt-14 pb-2 px-4">
          <h1
            className="plans-hero-title text-2xl sm:text-3xl lg:text-4xl font-black leading-tight mb-3"
            style={{ color: BLUE }}
          >
            اشتراك المكاتب العقارية
          </h1>
          <p className="max-w-md mx-auto" style={{ color: "#0f172a", fontSize: 15 }}>
            كل ما تحتاجه لإدارة وعرض عقارات مكتبك في مكان واحد
          </p>
        </div>

        {/* ── 2. Features grid ── */}
        <section className="features-section">
          <h2 className="features-title">ماذا ستحصل عند الاشتراك؟</h2>
          <div className="feat-grid">
            {FEATURE_CARDS.map(({ emoji, title, desc }) => (
              <div key={title} className="feat-card">
                <div className="feat-emoji">{emoji}</div>
                <p className="feat-title">{title}</p>
                <p className="feat-desc">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. Pricing card ── */}
        <div className="pricing-section px-4 pb-4 flex justify-center">
          <div className="w-full max-w-sm relative">

            {/* Discount badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <div
                className="text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap"
                style={{ background: ACCENT }}
              >
                خصم 50% لفترة محدودة
              </div>
            </div>

            <div className="pricing-card" style={{ paddingTop: 36 }}>
              <h2>باقة المكاتب العقارية</h2>
              <div className="price-old">29 د.ك / شهرياً</div>
              <div className="price-new">14.5 <span>د.ك / شهرياً</span></div>
              <div className="pricing-desc">كل ما تحتاجه لإدارة وعرض عقاراتك في مكان واحد</div>
              <div className="trial-line">👇 جرب المنصة مجانًا لمدة 7 أيام بدون دفع</div>
              <button
                className="cta-btn"
                onClick={handleCTA}
                data-testid="button-start-trial"
              >
                ابدأ التجربة المجانية
              </button>
            </div>
          </div>
        </div>

        {/* ── 5. WhatsApp ── */}
        <div className="max-w-xl mx-auto px-4 pt-4 pb-16">
          <div
            className="text-center rounded-2xl p-7 border"
            style={{ background: "#ffffff", borderColor: "#e5e7eb" }}
          >
            <h3 className="text-lg font-bold mb-2" style={{ color: BLUE }}>هل لديك سؤال؟</h3>
            <p className="mb-4" style={{ color: "#0f172a", fontSize: 15 }}>
              تواصل معنا عبر واتساب وسنساعدك في تجهيز حساب مكتبك
            </p>
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background: WA_GREEN,
                color: "#fff",
                fontWeight: 700,
                fontSize: "14px",
                height: "44px",
                paddingLeft: "28px",
                paddingRight: "28px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onClick={() =>
                window.open(
                  `https://wa.me/96595005151?text=${encodeURIComponent("مرحبا، اريد الاستفسار عن الاشتراك في منصة Finde")}`,
                  "_blank"
                )
              }
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              data-testid="button-contact-whatsapp"
            >
              <MessageCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
              واتساب
            </button>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
