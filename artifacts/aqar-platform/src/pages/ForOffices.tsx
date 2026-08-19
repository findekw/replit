import MainLayout from "@/components/layout/MainLayout";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  ShieldCheck, ArrowLeft, Link2, LayoutGrid, Users, BarChart3, Share2,
  MessageCircle, Building2, Clock, CheckCircle2, XCircle, Plus, Send,
  Sparkles, Star, ChevronDown, Instagram, CreditCard, Gauge, Search,
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { getApiBase } from "@/lib/apiBase";
import { useOfficeAuth } from "@/lib/AuthContext";

const OFF_BASE = getApiBase();
const WA_NUMBER = "96595005151";
const WA_TEXT = "مرحبا، اريد الاستفسار عن الاشتراك في منصة Finde لمكتبي العقاري";

type PublicPlan = { id: number; nameAr: string; price: number; currency: string; maxListings: number; durationDays?: number };

// ── The 5 questions a real-estate office owner actually asks (client-supplied) ──
const FAQS: { q: string; a: string }[] = [
  {
    q: "شنو راح تضيف Finde لمكتبي؟",
    a: "تمنح المكتب مكانًا منظمًا لإدارة عقاراته وعرضها، ومعرفة أدائها وتنظيم المهتمين بها — بدل ما تكون العقارات متناثرة في الجوال والمحادثات.",
  },
  {
    q: "عندي واتساب وإنستغرام ومشترك بمنصات عقارية، ليش أحتاج Finde؟",
    a: "Finde لا تستبدل هذه القنوات؛ بل تمنح المكتب صفحة ورابطًا خاصين به يمكن مشاركتهما من خلالها، مع أدوات لإدارة العقارات والمهتمين. تبقى تنشر مثل ما تحب — لكن كل شيء يرجع لمكان واحد منظم يخصّك.",
  },
  {
    q: "شلون أقدر أجمع عقارات مكتبي وأشاركها مع العملاء؟",
    a: "يحصل المكتب على صفحة خاصة تجمع عقاراته ورابط واحد يستطيع إرساله مباشرة للعميل — في الواتساب أو الإنستغرام أو على كارت العمل — والعميل يشوف كل معروضاتك بشكل مرتّب.",
  },
  {
    q: "شلون أعرف منو مهتم بأي عقار وأتابعه؟",
    a: "توفر Finde مكانًا لتنظيم بيانات المهتمين وربط كل مهتم بالعقار الذي أبدى اهتمامه به، وفق الوظائف المتاحة داخل المنصة — فلا يضيع منك عميل ولا رقم.",
  },
  {
    q: "هل استخدام المنصة سهل؟ وكم تكلف؟",
    a: "المنصة بسيطة ومصمّمة للموبايل — تضيف عقار وتشارك رابطك في دقائق. تقدر تجرّب Finde مجانًا لمدة 14 يومًا وتتعرف على وظائفها بنفسك، وبعد التجربة الاشتراك الشهري الحالي 14.5 د.ك فقط.",
  },
];

const PAINS = [
  "عقاراتك متناثرة بين الجوال والمحادثات والاسكرين شوت.",
  "عميل سأل عن شقة… وبعد أسبوع ضاع رقمه ونسيت أي عقار يبيه.",
  "تنشر نفس العقار في كذا مكان، وما تعرف أيها لا زال شغّال.",
  "ما عندك رابط واحد محترم ترسله للعميل يجمع كل معروضاتك.",
];

const PILLARS = [
  { icon: <LayoutGrid size={24} />, title: "تنظيم كامل", desc: "كل عقاراتك في لوحة واحدة — تضيف، تعدّل، وتحذف في ثوانٍ من موبايلك." },
  { icon: <Building2 size={24} />, title: "عرض احترافي", desc: "عقاراتك تُعرض بشكل مرتّب أمام باحثين جادّين داخل المنصة كل يوم." },
  { icon: <BarChart3 size={24} />, title: "أداء واضح", desc: "تعرف عدد المشاهدات والتفاعل على كل عقار — وتركّز على اللي يشتغل." },
  { icon: <Users size={24} />, title: "متابعة المهتمين", desc: "كل عميل مهتم مربوط بالعقار اللي سأل عنه — منظّم في مكان واحد." },
];

const STEPS = [
  { n: "1", icon: <Plus size={22} />, title: "سجّل مكتبك", desc: "أنشئ حساب مكتبك في دقائق واحصل على رابطك الخاص." },
  { n: "2", icon: <Building2 size={22} />, title: "أضف عقاراتك", desc: "أضف معروضاتك بالصور والتفاصيل من موبايلك بسهولة." },
  { n: "3", icon: <Send size={22} />, title: "شارك واستقبل", desc: "شارك رابطك في واتساب وإنستغرام، واستقبل عملاءك مباشرة." },
];

const FEATURES = [
  { icon: <Link2 size={20} />, title: "رابط خاص لمكتبك", desc: "شارك جميع عقاراتك برابط واحد في واتساب وإنستغرام والبزنس كارد." },
  { icon: <Building2 size={20} />, title: "صفحة خاصة لمكتبك", desc: "صفحة داخل المنصة تعرض جميع عقاراتك بشكل منظم ومحترف." },
  { icon: <LayoutGrid size={20} />, title: "إدارة العقارات", desc: "أضف وعدّل عقاراتك بسهولة من لوحة تحكم واحدة." },
  { icon: <Gauge size={20} />, title: "عرض مستمر يوميًا", desc: "عقاراتك تظهر للباحثين داخل المنصة بشكل يومي." },
  { icon: <MessageCircle size={20} />, title: "تواصل مباشر", desc: "استقبل العملاء مباشرة عبر واتساب أو اتصال بدون تعقيد." },
  { icon: <Users size={20} />, title: "العملاء المهتمون", desc: "تابع كل من أبدى اهتمامًا بعقاراتك من مكان واحد." },
  { icon: <BarChart3 size={20} />, title: "متابعة الأداء", desc: "اعرف عدد المشاهدات والتفاعل على عقاراتك بسهولة." },
  { icon: <ShieldCheck size={20} />, title: "هوية موثوقة", desc: "مكتب مرخّص بصفحة رسمية تعزّز ثقة العميل فيك." },
];

export default function ForOffices() {
  const { officeId } = useOfficeAuth();
  const [, navigate] = useLocation();

  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [trialDays, setTrialDays] = useState(14);
  const [openFaq, setOpenFaq] = useState<number>(0);

  useEffect(() => {
    fetch(`${OFF_BASE}/api/platform/trial-days`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { days?: number }) => { if (d.days) setTrialDays(d.days); })
      .catch(() => undefined);
    fetch(`${OFF_BASE}/api/plans`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setPlans(Array.isArray(d) ? d : (d?.plans ?? [])))
      .catch(() => setPlans([]));
  }, []);

  const primaryPlan = plans[0] ?? { id: 0, nameAr: "باقة المكاتب العقارية", price: 14.5, currency: "KWD", maxListings: 30, durationDays: 30 };
  const perDay = (Number(primaryPlan.price) / 30);

  const goRegister = () => navigate(officeId ? "/dashboard" : "/register");
  const openWa = () => window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_TEXT)}`, "_blank");

  // Scroll-reveal, same pattern as Home.
  useEffect(() => {
    const els = document.querySelectorAll(".fo-reveal");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  return (
    <MainLayout>
      <style>{`
        body { background: #F6F8FC !important; }
        .fo-wrap { direction: rtl; font-family: 'Cairo', sans-serif; color: #111827; }
        .fo-wrap *::selection { background: rgba(63,91,216,0.16); }

        /* reveal */
        .fo-reveal { opacity:0; transform:translateY(24px); transition:opacity .6s ease, transform .6s cubic-bezier(.22,1,.36,1); }
        .fo-reveal.in { opacity:1; transform:translateY(0); }

        /* ===== HERO ===== */
        .fo-hero {
          position:relative; overflow:hidden; text-align:center; padding:64px 16px 84px;
          background:
            radial-gradient(circle at 18% 12%, rgba(99,130,246,0.30) 0, transparent 42%),
            radial-gradient(circle at 88% 8%, rgba(63,91,216,0.34) 0, transparent 40%),
            radial-gradient(circle at 50% 120%, rgba(99,130,246,0.22) 0, transparent 55%),
            linear-gradient(150deg, #16203A 0%, #111827 45%, #2E3E72 78%, #667EEA 100%);
        }
        .fo-hero::before {
          content:""; position:absolute; inset:0; pointer-events:none;
          background-image:
            radial-gradient(circle at 20% 22%, rgba(255,255,255,0.10) 0, transparent 38%),
            radial-gradient(circle at 82% 4%, rgba(255,255,255,0.07) 0, transparent 34%);
        }
        .fo-hero-inner { position:relative; z-index:1; max-width:760px; margin:0 auto; }
        .fo-eyebrow {
          display:inline-flex; align-items:center; gap:7px; background:rgba(255,255,255,0.10); color:#EAF0FF;
          padding:7px 16px; border-radius:999px; font-size:12.5px; font-weight:700; margin-bottom:18px;
          backdrop-filter:blur(6px); border:1px solid rgba(255,255,255,0.16); box-shadow:0 4px 16px rgba(15,23,42,0.18);
        }
        .fo-h1 { font-size:30px; font-weight:800; color:#fff; margin:0 0 14px; line-height:1.4; letter-spacing:-0.6px; text-shadow:0 2px 20px rgba(0,0,0,0.45); }
        .fo-h1 .hl { background:linear-gradient(90deg,#C7D2FE,#fff); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
        .fo-sub { font-size:15.5px; color:rgba(243,247,255,0.94); margin:0 auto 28px; line-height:1.85; max-width:600px; text-shadow:0 1px 12px rgba(0,0,0,0.4); }
        .fo-hero-cta { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
        .fo-btn-primary {
          display:inline-flex; align-items:center; gap:8px; background:#fff; color:#16203A; font-weight:800; font-size:15px;
          padding:15px 28px; border-radius:999px; text-decoration:none; border:none; cursor:pointer; font-family:inherit;
          box-shadow:0 8px 22px rgba(0,0,0,0.22); transition:transform .18s, box-shadow .18s;
        }
        .fo-btn-primary:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(0,0,0,0.28); }
        .fo-btn-ghost {
          display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,0.10); color:#fff; font-weight:700; font-size:15px;
          padding:15px 26px; border-radius:999px; text-decoration:none; cursor:pointer; font-family:inherit;
          border:1px solid rgba(255,255,255,0.22); transition:background .18s;
        }
        .fo-btn-ghost:hover { background:rgba(255,255,255,0.18); }
        .fo-hero-note { display:flex; gap:8px 18px; justify-content:center; flex-wrap:wrap; margin-top:22px; }
        .fo-hero-note span { display:inline-flex; align-items:center; gap:6px; color:rgba(231,237,250,0.82); font-size:13px; font-weight:600; }

        /* ===== BUYER ENTRY STRIP ===== */
        .fo-buyer { max-width:1120px; margin:-40px auto 0; padding:0 16px; position:relative; z-index:2; }
        .fo-buyer-box { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; background:#fff; border:1px solid #E5E9F2; border-radius:18px; padding:16px 22px; box-shadow:0 14px 36px rgba(15,23,42,0.12); }
        .fo-buyer-info { display:flex; align-items:center; gap:14px; }
        .fo-buyer-ic { width:46px; height:46px; border-radius:13px; background:#EEF2FF; color:#667EEA; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .fo-buyer-info strong { display:block; font-size:16px; font-weight:800; color:#111827; }
        .fo-buyer-info span { font-size:13px; color:#64748B; font-weight:600; }
        .fo-buyer-btn { display:inline-flex; align-items:center; gap:8px; background:#667EEA; color:#fff; font-weight:800; font-size:14.5px; padding:12px 22px; border-radius:999px; text-decoration:none; white-space:nowrap; transition:background .18s, transform .18s; }
        .fo-buyer-btn:hover { background:#3349C0; transform:translateY(-1px); }
        @media(max-width:560px){ .fo-buyer-box{ flex-direction:column; align-items:stretch; text-align:center; } .fo-buyer-info{ justify-content:center; } .fo-buyer-btn{ justify-content:center; } }

        /* ===== SECTION SHELL ===== */
        .fo-section { max-width:1120px; margin:0 auto; padding:56px 16px 0; }
        .fo-sec-center { text-align:center; max-width:640px; margin:0 auto 34px; }
        .fo-kicker { display:inline-block; font-size:13px; font-weight:800; color:#667EEA; background:#EEF2FF; padding:5px 14px; border-radius:999px; margin-bottom:12px; }
        .fo-sec-title { font-size:25px; font-weight:800; color:#111827; margin:0 0 10px; letter-spacing:-0.5px; line-height:1.4; }
        .fo-sec-desc { font-size:15px; color:#64748B; margin:0; line-height:1.8; }

        /* ===== PAINS ===== */
        .fo-pain-grid { display:grid; grid-template-columns:1fr; gap:12px; max-width:760px; margin:0 auto; }
        @media(min-width:700px){ .fo-pain-grid{ grid-template-columns:1fr 1fr; } }
        .fo-pain { display:flex; align-items:flex-start; gap:12px; background:#fff; border:1px solid #EDF1F7; border-radius:16px; padding:18px; box-shadow:0 6px 20px rgba(15,23,42,0.05); }
        .fo-pain .ic { flex-shrink:0; width:34px; height:34px; border-radius:10px; background:#FEF2F2; color:#EF4444; display:flex; align-items:center; justify-content:center; }
        .fo-pain p { margin:0; font-size:14.5px; font-weight:600; color:#334155; line-height:1.6; }

        /* ===== PILLARS ===== */
        .fo-pillars { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
        @media(min-width:900px){ .fo-pillars{ grid-template-columns:repeat(4,minmax(0,1fr)); } }
        .fo-pillar { background:#fff; border:1px solid #EDF1F7; border-radius:20px; padding:26px 20px; text-align:center; box-shadow:0 10px 30px rgba(15,23,42,0.05); transition:transform .2s, box-shadow .2s; }
        .fo-pillar:hover { transform:translateY(-3px); box-shadow:0 18px 40px rgba(15,23,42,0.10); }
        .fo-pillar-ic { width:56px; height:56px; border-radius:16px; background:#EEF2FF; color:#667EEA; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
        .fo-pillar h3 { font-size:16px; font-weight:800; color:#111827; margin:0 0 7px; }
        .fo-pillar p { font-size:13.5px; color:#64748B; margin:0; line-height:1.7; }

        /* ===== SPOTLIGHT (alternating rows) ===== */
        .fo-spot { display:grid; grid-template-columns:1fr; gap:26px; align-items:center; background:#fff; border:1px solid #EDF1F7; border-radius:24px; padding:28px; box-shadow:0 12px 34px rgba(15,23,42,0.06); }
        @media(min-width:820px){ .fo-spot{ grid-template-columns:1.05fr 1fr; padding:38px; gap:40px; } .fo-spot.rev .fo-spot-visual{ order:-1; } }
        .fo-spot + .fo-spot { margin-top:22px; }
        .fo-spot-tag { display:inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:800; color:#667EEA; background:#EEF2FF; padding:5px 12px; border-radius:999px; margin-bottom:12px; }
        .fo-spot h3 { font-size:21px; font-weight:800; color:#111827; margin:0 0 12px; letter-spacing:-0.4px; line-height:1.45; }
        .fo-spot p { font-size:15px; color:#475569; margin:0 0 16px; line-height:1.85; }
        .fo-spot ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; }
        .fo-spot li { display:flex; align-items:flex-start; gap:9px; font-size:14.5px; color:#334155; font-weight:600; }
        .fo-spot li .ic { flex-shrink:0; color:#22C55E; margin-top:1px; }

        /* link mock */
        .fo-mock { background:linear-gradient(135deg,#F8FAFF,#EEF2FF); border:1px solid #E0E7FF; border-radius:18px; padding:22px; }
        .fo-mock-bar { display:flex; align-items:center; gap:8px; background:#fff; border:1px solid #E2E8F0; border-radius:12px; padding:11px 14px; font-size:14px; font-weight:700; color:#334155; direction:ltr; justify-content:center; box-shadow:0 4px 12px rgba(15,23,42,0.05); }
        .fo-mock-bar b { color:#667EEA; }
        .fo-mock-share { display:flex; gap:10px; justify-content:center; margin-top:16px; flex-wrap:wrap; }
        .fo-chip { display:inline-flex; align-items:center; gap:7px; background:#fff; border:1px solid #E2E8F0; border-radius:999px; padding:9px 15px; font-size:13px; font-weight:700; color:#334155; }

        /* leads mock */
        .fo-lead { display:flex; align-items:center; gap:12px; background:#fff; border:1px solid #E8ECF3; border-radius:14px; padding:12px 14px; box-shadow:0 3px 10px rgba(15,23,42,0.04); }
        .fo-lead + .fo-lead { margin-top:10px; }
        .fo-lead-av { width:38px; height:38px; border-radius:50%; background:#EEF2FF; color:#667EEA; display:flex; align-items:center; justify-content:center; font-weight:800; flex-shrink:0; }
        .fo-lead-main { flex:1; min-width:0; }
        .fo-lead-name { font-size:14px; font-weight:800; color:#111827; }
        .fo-lead-sub { font-size:12.5px; color:#64748B; margin-top:2px; }
        .fo-lead-badge { font-size:11.5px; font-weight:800; padding:4px 10px; border-radius:999px; white-space:nowrap; }

        /* ===== COMPARE (complements, not replaces) ===== */
        .fo-compare { display:grid; grid-template-columns:1fr; gap:16px; }
        @media(min-width:760px){ .fo-compare{ grid-template-columns:1fr 1fr; } }
        .fo-cmp { border-radius:20px; padding:26px; border:1px solid #EDF1F7; }
        .fo-cmp.before { background:#fff; }
        .fo-cmp.after { background:linear-gradient(160deg,#EEF2FF,#F5F7FF); border-color:#DBE3FF; }
        .fo-cmp h4 { font-size:15px; font-weight:800; margin:0 0 16px; display:flex; align-items:center; gap:8px; }
        .fo-cmp.before h4 { color:#64748B; }
        .fo-cmp.after h4 { color:#3F51C0; }
        .fo-cmp ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:12px; }
        .fo-cmp li { display:flex; align-items:flex-start; gap:9px; font-size:14px; font-weight:600; line-height:1.6; }
        .fo-cmp.before li { color:#64748B; }
        .fo-cmp.after li { color:#1E293B; }

        /* ===== STEPS ===== */
        .fo-steps { display:grid; grid-template-columns:1fr; gap:16px; }
        @media(min-width:760px){ .fo-steps{ grid-template-columns:repeat(3,1fr); } }
        .fo-step { position:relative; background:#fff; border:1px solid #EDF1F7; border-radius:20px; padding:28px 22px; text-align:center; box-shadow:0 10px 30px rgba(15,23,42,0.05); }
        .fo-step-n { position:absolute; top:16px; left:18px; font-size:34px; font-weight:900; color:#EEF2FF; line-height:1; }
        .fo-step-ic { width:54px; height:54px; border-radius:15px; background:linear-gradient(135deg,#667EEA,#3349C0); color:#fff; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; box-shadow:0 8px 20px rgba(63,91,216,0.30); }
        .fo-step h3 { font-size:16.5px; font-weight:800; color:#111827; margin:0 0 7px; }
        .fo-step p { font-size:13.5px; color:#64748B; margin:0; line-height:1.7; }

        /* ===== FEATURES ===== */
        .fo-feat-grid { display:grid; grid-template-columns:1fr; gap:12px; }
        @media(min-width:620px){ .fo-feat-grid{ grid-template-columns:1fr 1fr; } }
        @media(min-width:960px){ .fo-feat-grid{ grid-template-columns:repeat(4,1fr); } }
        .fo-feat { background:#fff; border:1px solid #EDF1F7; border-radius:16px; padding:20px; box-shadow:0 6px 18px rgba(15,23,42,0.04); transition:transform .2s, box-shadow .2s; }
        .fo-feat:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(15,23,42,0.09); }
        .fo-feat-ic { width:42px; height:42px; border-radius:12px; background:#EEF2FF; color:#667EEA; display:flex; align-items:center; justify-content:center; margin-bottom:12px; }
        .fo-feat h3 { font-size:15px; font-weight:800; color:#111827; margin:0 0 6px; }
        .fo-feat p { font-size:13px; color:#64748B; margin:0; line-height:1.65; }

        /* ===== PRICING ===== */
        .fo-price-wrap { max-width:460px; margin:0 auto; }
        .fo-price { position:relative; background:#fff; border:1px solid #E5E9F2; border-radius:24px; padding:34px 26px 28px; text-align:center; box-shadow:0 18px 44px rgba(15,23,42,0.10); }
        .fo-price-badge { position:absolute; top:-14px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg,#667EEA,#3349C0); color:#fff; font-size:12px; font-weight:800; padding:7px 16px; border-radius:999px; box-shadow:0 6px 16px rgba(63,91,216,0.35); white-space:nowrap; }
        .fo-price h3 { font-size:18px; font-weight:800; color:#111827; margin:6px 0 4px; }
        .fo-price-amount { font-size:44px; font-weight:900; color:#111827; line-height:1.1; letter-spacing:-1px; margin:8px 0 2px; }
        .fo-price-amount span { font-size:16px; font-weight:700; color:#64748B; }
        .fo-price-per { font-size:13.5px; color:#94A3B8; font-weight:600; margin-bottom:16px; }
        .fo-price-list { list-style:none; margin:0 0 20px; padding:0; display:flex; flex-direction:column; gap:11px; text-align:right; }
        .fo-price-list li { display:flex; align-items:flex-start; gap:9px; font-size:14px; font-weight:600; color:#334155; }
        .fo-price-list li .ic { color:#22C55E; flex-shrink:0; margin-top:1px; }
        .fo-price-cta { width:100%; border:none; border-radius:14px; background:linear-gradient(135deg,#667EEA,#3349C0); color:#fff; font-size:16px; font-weight:800; padding:15px; cursor:pointer; font-family:inherit; box-shadow:0 8px 20px rgba(63,91,216,0.28); transition:transform .18s, box-shadow .18s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .fo-price-cta:hover { transform:translateY(-2px); box-shadow:0 12px 26px rgba(63,91,216,0.36); }
        .fo-price-foot { font-size:12.5px; color:#94A3B8; margin:14px 0 0; }

        /* ===== FAQ ===== */
        .fo-faq { max-width:760px; margin:0 auto; display:flex; flex-direction:column; gap:12px; }
        .fo-faq-item { background:#fff; border:1px solid #E8ECF3; border-radius:16px; overflow:hidden; box-shadow:0 4px 14px rgba(15,23,42,0.04); transition:border-color .2s, box-shadow .2s; }
        .fo-faq-item.open { border-color:#C7D2FE; box-shadow:0 10px 26px rgba(63,91,216,0.10); }
        .fo-faq-q { width:100%; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:18px 20px; background:transparent; border:none; cursor:pointer; text-align:right; font-family:inherit; font-size:15.5px; font-weight:800; color:#111827; }
        .fo-faq-q .chev { flex-shrink:0; color:#667EEA; transition:transform .25s; }
        .fo-faq-item.open .fo-faq-q .chev { transform:rotate(180deg); }
        .fo-faq-a { max-height:0; overflow:hidden; transition:max-height .3s ease; }
        .fo-faq-item.open .fo-faq-a { max-height:320px; }
        .fo-faq-a p { margin:0; padding:0 20px 20px; font-size:14.5px; color:#475569; line-height:1.9; }

        /* ===== FINAL CTA ===== */
        .fo-final { max-width:1120px; margin:60px auto 0; padding:0 16px; }
        .fo-final-box { position:relative; overflow:hidden; background:linear-gradient(125deg,#16203A 0%,#111827 42%,#667EEA 100%); border-radius:28px; padding:54px 28px; text-align:center; box-shadow:0 18px 44px rgba(31,42,68,0.20); }
        .fo-final-box::before { content:""; position:absolute; right:-60px; top:-60px; width:240px; height:240px; background:radial-gradient(circle, rgba(99,130,246,0.45), transparent 70%); border-radius:50%; }
        .fo-final-box::after { content:""; position:absolute; left:-50px; bottom:-50px; width:200px; height:200px; background:rgba(255,255,255,0.06); border-radius:50%; }
        .fo-final-inner { position:relative; z-index:1; max-width:640px; margin:0 auto; }
        .fo-final-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.18); color:#EAF0FF; padding:6px 14px; border-radius:999px; font-size:12.5px; font-weight:700; margin-bottom:16px; }
        .fo-final-box h2 { color:#fff; font-size:27px; font-weight:800; margin:0 0 12px; letter-spacing:-0.5px; line-height:1.4; }
        .fo-final-box p { color:rgba(231,237,250,0.88); font-size:15px; margin:0 0 26px; line-height:1.8; }
        .fo-final-cta { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
        .fo-wa { display:inline-flex; align-items:center; gap:8px; background:#25D366; color:#fff; font-weight:800; font-size:15px; padding:15px 26px; border-radius:999px; border:none; cursor:pointer; font-family:inherit; transition:transform .18s, opacity .18s; }
        .fo-wa:hover { transform:translateY(-2px); opacity:.94; }

        @media(min-width:769px){
          .fo-hero{ padding:88px 24px 104px; }
          .fo-h1{ font-size:44px; }
          .fo-sub{ font-size:17px; }
          .fo-sec-title{ font-size:30px; }
          .fo-final-box h2{ font-size:32px; }
        }
      `}</style>

      <div className="fo-wrap">

        {/* ===== HERO ===== */}
        <section className="fo-hero">
          <div className="fo-hero-inner">
            <span className="fo-eyebrow"><ShieldCheck size={14} /> منصة المكاتب العقارية في الكويت</span>
            <h1 className="fo-h1">
              مكتبك العقاري في مكان واحد — <span className="hl">منظّم، احترافي، وبرابط تشاركه.</span>
            </h1>
            <p className="fo-sub">
              Finde يجمع عقارات مكتبك في صفحة ورابط خاصّين بك، ويمنحك أدوات بسيطة لإدارة معروضاتك ومتابعة المهتمين ومعرفة أداء كل عقار — كل شيء من موبايلك.
            </p>
            <div className="fo-hero-cta">
              <button className="fo-btn-primary" onClick={goRegister}>
                ابدأ تجربتك المجانية {trialDays} يومًا <ArrowLeft size={16} />
              </button>
              <a className="fo-btn-ghost" href="#pricing">شوف الأسعار</a>
            </div>
            <div className="fo-hero-note">
              <span><CheckCircle2 size={14} /> بدون بطاقة بنكية للتجربة</span>
              <span><Clock size={14} /> تفعيل فوري</span>
              <span><Sparkles size={14} /> مصمّم للموبايل</span>
            </div>
          </div>
        </section>

        {/* ===== BUYER ENTRY (visitors searching for a property) ===== */}
        <section className="fo-buyer">
          <div className="fo-buyer-box">
            <div className="fo-buyer-info">
              <span className="fo-buyer-ic"><Search size={22} /></span>
              <div>
                <strong>تبحث عن عقار؟</strong>
                <span>تصفّح آلاف العقارات المعروضة من المكاتب في كل الكويت</span>
              </div>
            </div>
            <Link href="/properties" className="fo-buyer-btn">تصفّح العقارات <ArrowLeft size={16} /></Link>
          </div>
        </section>

        {/* ===== PAINS ===== */}
        <section className="fo-section fo-reveal">
          <div className="fo-sec-center">
            <span className="fo-kicker">الوضع الحالي</span>
            <h2 className="fo-sec-title">تعرف الإحساس ده؟</h2>
            <p className="fo-sec-desc">أغلب المكاتب تدير عقاراتها من الجوال والمحادثات — فتضيع العقارات، ويضيع العملاء معها.</p>
          </div>
          <div className="fo-pain-grid">
            {PAINS.map((p, i) => (
              <div className="fo-pain" key={i}>
                <span className="ic"><XCircle size={18} /></span>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== PILLARS (Q1: what Finde adds) ===== */}
        <section className="fo-section fo-reveal">
          <div className="fo-sec-center">
            <span className="fo-kicker">شنو يضيف Finde لمكتبك؟</span>
            <h2 className="fo-sec-title">مكان واحد منظّم لكل عقاراتك ومهتمّيك</h2>
            <p className="fo-sec-desc">بدل ما يكون كل شيء متناثر، يصير لمكتبك نظام واحد يعرض عقاراتك ويريك أداءها وينظّم عملاءك.</p>
          </div>
          <div className="fo-pillars">
            {PILLARS.map((p) => (
              <div className="fo-pillar" key={p.title}>
                <div className="fo-pillar-ic">{p.icon}</div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== SPOTLIGHT 1 — page & link (Q3) ===== */}
        <section className="fo-section fo-reveal">
          <div className="fo-spot">
            <div>
              <span className="fo-spot-tag"><Link2 size={13} /> صفحتك ورابطك</span>
              <h3>صفحة خاصة لمكتبك… ورابط واحد تشاركه مع كل عميل</h3>
              <p>يحصل مكتبك على صفحة تجمع جميع عقاراته بشكل مرتّب، ورابط واحد ترسله مباشرة للعميل في الواتساب أو الإنستغرام أو تحطّه على كارت العمل — والعميل يشوف كل معروضاتك في لحظة.</p>
              <ul>
                <li><CheckCircle2 size={17} className="ic" /> رابط واحد يجمع كل عقاراتك</li>
                <li><CheckCircle2 size={17} className="ic" /> صفحة رسمية باسم مكتبك تعزّز ثقة العميل</li>
                <li><CheckCircle2 size={17} className="ic" /> تشاركه في أي مكان: واتساب، إنستغرام، كارت العمل</li>
              </ul>
            </div>
            <div className="fo-spot-visual">
              <div className="fo-mock">
                <div className="fo-mock-bar">finde.co/<b>your-office</b></div>
                <div className="fo-mock-share">
                  <span className="fo-chip"><WhatsAppIcon size={15} /> واتساب</span>
                  <span className="fo-chip"><Instagram size={15} color="#E1306C" /> إنستغرام</span>
                  <span className="fo-chip"><Share2 size={15} color="#667EEA" /> مشاركة</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SPOTLIGHT 2 — leads (Q4) ===== */}
        <section className="fo-section fo-reveal">
          <div className="fo-spot rev">
            <div>
              <span className="fo-spot-tag"><Users size={13} /> متابعة المهتمين</span>
              <h3>اعرف منو مهتم بأي عقار — وتابعه بدون ما يضيع منك</h3>
              <p>كل عميل أبدى اهتمامًا بعقار يظهر لك مربوطًا بذلك العقار، منظّمًا في مكان واحد. لا رقم يضيع، ولا عميل تنساه — وتقدر تتابع كل واحد وتقفل الصفقة.</p>
              <ul>
                <li><CheckCircle2 size={17} className="ic" /> كل مهتم مربوط بالعقار اللي سأل عنه</li>
                <li><CheckCircle2 size={17} className="ic" /> بيانات المهتمين منظّمة في مكان واحد</li>
                <li><CheckCircle2 size={17} className="ic" /> متابعة أسهل = صفقات أكثر</li>
              </ul>
            </div>
            <div className="fo-spot-visual">
              <div>
                <div className="fo-lead">
                  <div className="fo-lead-av">م</div>
                  <div className="fo-lead-main">
                    <div className="fo-lead-name">مهتم بشقة — السالمية</div>
                    <div className="fo-lead-sub">استفسر قبل ساعتين</div>
                  </div>
                  <span className="fo-lead-badge" style={{ background: "#EEF2FF", color: "#667EEA" }}>جديد</span>
                </div>
                <div className="fo-lead">
                  <div className="fo-lead-av">ع</div>
                  <div className="fo-lead-main">
                    <div className="fo-lead-name">مهتم بأرض — الوفرة</div>
                    <div className="fo-lead-sub">تمت المتابعة</div>
                  </div>
                  <span className="fo-lead-badge" style={{ background: "#ECFDF5", color: "#059669" }}>متابعة</span>
                </div>
                <div className="fo-lead">
                  <div className="fo-lead-av">ح</div>
                  <div className="fo-lead-main">
                    <div className="fo-lead-name">مهتم بمحل — حولي</div>
                    <div className="fo-lead-sub">قيد التفاوض</div>
                  </div>
                  <span className="fo-lead-badge" style={{ background: "#FEF3C7", color: "#B45309" }}>مهم</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== COMPARE (Q2: complements, not replaces) ===== */}
        <section className="fo-section fo-reveal">
          <div className="fo-sec-center">
            <span className="fo-kicker">عندي واتساب وإنستغرام… ليش أحتاج Finde؟</span>
            <h2 className="fo-sec-title">Finde لا يستبدل قنواتك — بل ينظّمها</h2>
            <p className="fo-sec-desc">تبقى تنشر مثل ما تحب في أي مكان، لكن كل شيء يرجع لمكان واحد منظّم يخصّك أنت.</p>
          </div>
          <div className="fo-compare">
            <div className="fo-cmp before">
              <h4><XCircle size={17} /> بدون Finde</h4>
              <ul>
                <li><XCircle size={16} style={{ flexShrink: 0, marginTop: 1, color: "#CBD5E1" }} /> عقارات متناثرة بين المنشورات والمحادثات</li>
                <li><XCircle size={16} style={{ flexShrink: 0, marginTop: 1, color: "#CBD5E1" }} /> تعيد إرسال كل عقار للعميل يدويًا</li>
                <li><XCircle size={16} style={{ flexShrink: 0, marginTop: 1, color: "#CBD5E1" }} /> صعب تعرف أي عقار شغّال وأي عميل مهتم</li>
                <li><XCircle size={16} style={{ flexShrink: 0, marginTop: 1, color: "#CBD5E1" }} /> لا رابط واحد رسمي يمثّل مكتبك</li>
              </ul>
            </div>
            <div className="fo-cmp after">
              <h4><Sparkles size={17} /> مع Finde</h4>
              <ul>
                <li><CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1, color: "#22C55E" }} /> كل عقاراتك مجموعة في صفحة واحدة منظّمة</li>
                <li><CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1, color: "#22C55E" }} /> رابط واحد تشاركه في واتساب وإنستغرام</li>
                <li><CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1, color: "#22C55E" }} /> تعرف أداء كل عقار ومن هو المهتم</li>
                <li><CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1, color: "#22C55E" }} /> هوية رسمية موثوقة لمكتبك</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ===== STEPS ===== */}
        <section className="fo-section fo-reveal">
          <div className="fo-sec-center">
            <span className="fo-kicker">سهلة جدًا</span>
            <h2 className="fo-sec-title">ابدأ في 3 خطوات</h2>
            <p className="fo-sec-desc">من التسجيل إلى استقبال أول عميل — كل شيء يتم من موبايلك في دقائق.</p>
          </div>
          <div className="fo-steps">
            {STEPS.map((s) => (
              <div className="fo-step" key={s.n}>
                <span className="fo-step-n">{s.n}</span>
                <div className="fo-step-ic">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section className="fo-section fo-reveal">
          <div className="fo-sec-center">
            <span className="fo-kicker">كل شيء في اشتراك واحد</span>
            <h2 className="fo-sec-title">ماذا تحصل عند الاشتراك؟</h2>
          </div>
          <div className="fo-feat-grid">
            {FEATURES.map((f) => (
              <div className="fo-feat" key={f.title}>
                <div className="fo-feat-ic">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== PRICING (Q5) ===== */}
        <section id="pricing" className="fo-section fo-reveal">
          <div className="fo-sec-center">
            <span className="fo-kicker">سعر بسيط وواضح</span>
            <h2 className="fo-sec-title">جرّب مجانًا، ثم اشترك بثقة</h2>
            <p className="fo-sec-desc">تبدأ بتجربة كاملة مجانية لمدة {trialDays} يومًا — بدون دفع — تجرّب كل شيء بنفسك قبل ما تقرّر.</p>
          </div>
          <div className="fo-price-wrap">
            <div className="fo-price">
              <span className="fo-price-badge">🎁 {trialDays} يومًا مجانًا</span>
              <h3>{primaryPlan.nameAr}</h3>
              <div className="fo-price-amount">{primaryPlan.price} <span>د.ك / شهريًا</span></div>
              <div className="fo-price-per">بأقل من {perDay.toFixed(3)} د.ك في اليوم</div>
              <ul className="fo-price-list">
                <li><CheckCircle2 size={17} className="ic" /> صفحة ورابط خاص لمكتبك</li>
                {primaryPlan.maxListings > 0 && (
                  <li><CheckCircle2 size={17} className="ic" /> حتى {primaryPlan.maxListings} إعلان نشط</li>
                )}
                <li><CheckCircle2 size={17} className="ic" /> إدارة العقارات ومتابعة المهتمين</li>
                <li><CheckCircle2 size={17} className="ic" /> متابعة أداء ومشاهدات كل عقار</li>
                <li><CheckCircle2 size={17} className="ic" /> تواصل مباشر مع العملاء</li>
              </ul>
              <button className="fo-price-cta" onClick={goRegister}>
                <CreditCard size={18} /> ابدأ التجربة المجانية
              </button>
              <p className="fo-price-foot">بدون بطاقة بنكية · تلغي في أي وقت</p>
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section className="fo-section fo-reveal">
          <div className="fo-sec-center">
            <span className="fo-kicker">أسئلة أصحاب المكاتب</span>
            <h2 className="fo-sec-title">الأسئلة الشائعة</h2>
          </div>
          <div className="fo-faq">
            {FAQS.map((f, i) => (
              <div className={`fo-faq-item${openFaq === i ? " open" : ""}`} key={i}>
                <button className="fo-faq-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                  <span>{f.q}</span>
                  <ChevronDown size={20} className="chev" />
                </button>
                <div className="fo-faq-a"><p>{f.a}</p></div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="fo-final fo-reveal">
          <div className="fo-final-box">
            <div className="fo-final-inner">
              <span className="fo-final-pill"><Star size={13} /> ابدأ اليوم</span>
              <h2>جاهز تنقل مكتبك لمكان أنظف وأحترف؟</h2>
              <p>سجّل مكتبك الآن، جرّب Finde مجانًا لمدة {trialDays} يومًا، وشوف بنفسك كيف تصير إدارة عقاراتك وعملائك أسهل.</p>
              <div className="fo-final-cta">
                <button className="fo-btn-primary" onClick={goRegister}>
                  أضف مكتبك مجانًا <ArrowLeft size={16} />
                </button>
                <button className="fo-wa" onClick={openWa}>
                  <WhatsAppIcon size={18} /> استفسر عبر واتساب
                </button>
              </div>
            </div>
          </div>
        </section>

        <div style={{ height: 56 }} />
      </div>
    </MainLayout>
  );
}
