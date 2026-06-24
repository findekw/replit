import MainLayout from "@/components/layout/MainLayout";
import { Link, useLocation } from "wouter";
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Check, Search, ArrowLeft, Building2, MapPin, MessageCircle, ShieldCheck, TrendingUp, Star } from "lucide-react";
import { PropertyCard } from "@/components/PropertyCard";
import { OfficeCard } from "@/components/OfficeCard";
import { getApiBase } from "@/lib/apiBase";
import {
  useGetLatestProperties,
  useGetFeaturedOffices,
  useGetPlatformStats,
} from "@workspace/api-client-react";

const HOME_BASE = getApiBase();
const DEFAULT_HERO_IMG = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1920&q=70";

interface HeroSlide { id: number; imageUrl: string; title: string | null; subtitle: string | null; ctaText: string | null; ctaUrl: string | null; }

const TYPES_BY_STATUS: Record<string, string[]> = {
  "للإيجار": ["بيت", "قسيمة", "ارض", "دور", "شقة", "محل", "مكتب", "مخزن", "شاليه", "استراحة", "مزرعة", "عمارة", "مجمع", "قسيمة صناعية", "قسيمة حرفية"],
  "للبيع":   ["بيت", "قسيمة", "ارض", "دور", "شقة", "محل", "مكتب", "مخزن", "شاليه", "استراحة", "مزرعة", "عمارة", "مجمع", "قسيمة صناعية", "قسيمة حرفية"],
  "للبدل":   ["بيت", "ارض", "شقة"],
};

const AREAS: Record<string, string[]> = {
  "العاصمة":      ["الخالدية","الدسمة","الدعية","الدوحة","الروضة","السرة","الشامية","الشرق","الشويخ السكنية","الشويخ الصناعية","الصليبيخات","العديلية","الفيحاء","القادسية","القبلة","القيروان","المباركية","المرقاب","المنصورية","النزهة","اليرموك","بنيد القار","جابر الأحمد","حصة المبارك","دسمان","شمال غرب الصليبيخات","عبدالله السالم","غرناطة","قرطبة","كيفان"],
  "حولي":         ["البدع","الجابرية","الرميثية","الزهراء","السالمية","السلام","الشعب البحري","الشعب السكني","الشهداء","الصديق","بيان","حطين","حولي","سلوى","مبارك العبدالله","مشرف","ميدان حولي"],
  "الفروانية":    ["اسطبلات الفروانية","اشبيلية","الاندلس","الرابية","الرحاب","الرقعي","الري","الضجيج","العارضية","العارضية الحرفية","العمرية","الفردوس","الفروانية","جليب الشيوخ","جنوب عبدالله المبارك","خيطان","خيطان الجنوبي الجديدة","صباح الناصر","عبدالله المبارك","غرب عبدالله المبارك"],
  "مبارك الكبير": ["ابو الحصانية","ابو فطيرة","العدان","الفنيطيس","القرين","القصور","المسائل","المسيلة","صباح السالم","صبحان","غرب ابو فطيرة الحرفية","مبارك الكبير"],
  "الأحمدي":      ["ابو حليفة","اسطبلات الاحمدي","الاحمدي","الجليعة","الخيران السكنية","الرقة","الزور","الشعيبة الصناعية","الصباحية","الضباعية","الظهر","العقيلة","الفحيحيل","الفنطاس","المنقف","المهبولة","النويصيب","الوفرة","الوفرة السكنية","بنيدر","جابر العلي","جنوب صباح الاحمد","صباح الاحمد البحرية","صباح الاحمد السكنية","علي صباح السالم","فهد الاحمد","ميناء عبدالله","هدية"],
  "الجهراء":      ["اسطبلات الجهراء","الجهراء الصناعية","الجهراء القديمة","الخويسات","الصبية","الصليبية","الصليبيخات","العبدلي","العيون","القصر","المطلاع","النسيم","النعايم","النعيم","النهضة","الهجن","الواحة","امغرة الصناعية","تيماء","جنوب سعد العبدالله","سعد العبدالله","كبد"],
};

const GOV_ID: Record<string, number> = {
  "العاصمة": 1, "حولي": 2, "الفروانية": 3,
  "مبارك الكبير": 4, "الأحمدي": 5, "الجهراء": 6,
};

const _AREA_ID: { name: string; id: number; govId: number }[] = [
  {name:"الخالدية",id:57,govId:1},{name:"الدسمة",id:62,govId:1},{name:"الدعية",id:63,govId:1},{name:"الدوحة",id:64,govId:1},{name:"الروضة",id:10,govId:1},{name:"السرة",id:47,govId:1},{name:"الشامية",id:8,govId:1},{name:"الشرق",id:48,govId:1},{name:"الشويخ السكنية",id:45,govId:1},{name:"الشويخ الصناعية",id:49,govId:1},{name:"الصليبيخات",id:60,govId:1},{name:"العديلية",id:55,govId:1},{name:"الفيحاء",id:51,govId:1},{name:"القادسية",id:53,govId:1},{name:"القبلة",id:5,govId:1},{name:"القيروان",id:61,govId:1},{name:"المباركية",id:66,govId:1},{name:"المرقاب",id:2,govId:1},{name:"المنصورية",id:7,govId:1},{name:"النزهة",id:58,govId:1},{name:"اليرموك",id:65,govId:1},{name:"بنيد القار",id:4,govId:1},{name:"جابر الأحمد",id:46,govId:1},{name:"حصة المبارك",id:59,govId:1},{name:"دسمان",id:3,govId:1},{name:"شمال غرب الصليبيخات",id:50,govId:1},{name:"عبدالله السالم",id:56,govId:1},{name:"غرناطة",id:52,govId:1},{name:"قرطبة",id:54,govId:1},{name:"كيفان",id:9,govId:1},
  {name:"البدع",id:75,govId:2},{name:"الجابرية",id:17,govId:2},{name:"الرميثية",id:12,govId:2},{name:"الزهراء",id:68,govId:2},{name:"السالمية",id:16,govId:2},{name:"السلام",id:67,govId:2},{name:"الشعب البحري",id:74,govId:2},{name:"الشعب السكني",id:71,govId:2},{name:"الشهداء",id:70,govId:2},{name:"الصديق",id:69,govId:2},{name:"بيان",id:14,govId:2},{name:"حطين",id:20,govId:2},{name:"حولي",id:11,govId:2},{name:"سلوى",id:13,govId:2},{name:"مبارك العبدالله",id:72,govId:2},{name:"مشرف",id:15,govId:2},{name:"ميدان حولي",id:73,govId:2},
  {name:"اسطبلات الفروانية",id:90,govId:3},{name:"اشبيلية",id:83,govId:3},{name:"الاندلس",id:79,govId:3},{name:"الرابية",id:87,govId:3},{name:"الرحاب",id:23,govId:3},{name:"الرقعي",id:24,govId:3},{name:"الري",id:81,govId:3},{name:"الضجيج",id:88,govId:3},{name:"العارضية",id:80,govId:3},{name:"العارضية الحرفية",id:84,govId:3},{name:"العمرية",id:26,govId:3},{name:"الفردوس",id:89,govId:3},{name:"الفروانية",id:21,govId:3},{name:"جليب الشيوخ",id:85,govId:3},{name:"جنوب عبدالله المبارك",id:77,govId:3},{name:"خيطان",id:22,govId:3},{name:"خيطان الجنوبي الجديدة",id:78,govId:3},{name:"صباح الناصر",id:86,govId:3},{name:"عبدالله المبارك",id:82,govId:3},{name:"غرب عبدالله المبارك",id:76,govId:3},
  {name:"ابو الحصانية",id:95,govId:4},{name:"ابو فطيرة",id:91,govId:4},{name:"العدان",id:93,govId:4},{name:"الفنيطيس",id:29,govId:4},{name:"القرين",id:96,govId:4},{name:"القصور",id:94,govId:4},{name:"المسائل",id:92,govId:4},{name:"المسيلة",id:32,govId:4},{name:"صباح السالم",id:30,govId:4},{name:"صبحان",id:98,govId:4},{name:"غرب ابو فطيرة الحرفية",id:97,govId:4},{name:"مبارك الكبير",id:28,govId:4},
  {name:"ابو حليفة",id:118,govId:5},{name:"اسطبلات الاحمدي",id:110,govId:5},{name:"الاحمدي",id:117,govId:5},{name:"الجليعة",id:102,govId:5},{name:"الخيران السكنية",id:100,govId:5},{name:"الرقة",id:39,govId:5},{name:"الزور",id:103,govId:5},{name:"الشعيبة الصناعية",id:106,govId:5},{name:"الصباحية",id:113,govId:5},{name:"الضباعية",id:108,govId:5},{name:"الظهر",id:101,govId:5},{name:"العقيلة",id:112,govId:5},{name:"الفحيحيل",id:34,govId:5},{name:"الفنطاس",id:38,govId:5},{name:"المنقف",id:35,govId:5},{name:"المهبولة",id:36,govId:5},{name:"النويصيب",id:104,govId:5},{name:"الوفرة",id:121,govId:5},{name:"الوفرة السكنية",id:115,govId:5},{name:"بنيدر",id:105,govId:5},{name:"جابر العلي",id:99,govId:5},{name:"جنوب صباح الاحمد",id:109,govId:5},{name:"صباح الاحمد البحرية",id:114,govId:5},{name:"صباح الاحمد السكنية",id:111,govId:5},{name:"علي صباح السالم",id:119,govId:5},{name:"فهد الاحمد",id:116,govId:5},{name:"ميناء عبدالله",id:107,govId:5},{name:"هدية",id:120,govId:5},
  {name:"اسطبلات الجهراء",id:133,govId:6},{name:"الجهراء الصناعية",id:134,govId:6},{name:"الجهراء القديمة",id:124,govId:6},{name:"الخويسات",id:137,govId:6},{name:"الصبية",id:132,govId:6},{name:"الصليبية",id:129,govId:6},{name:"الصليبيخات",id:41,govId:6},{name:"العبدلي",id:130,govId:6},{name:"العيون",id:127,govId:6},{name:"القصر",id:43,govId:6},{name:"المطلاع",id:122,govId:6},{name:"النسيم",id:123,govId:6},{name:"النعايم",id:138,govId:6},{name:"النعيم",id:42,govId:6},{name:"النهضة",id:139,govId:6},{name:"الهجن",id:128,govId:6},{name:"الواحة",id:125,govId:6},{name:"امغرة الصناعية",id:126,govId:6},{name:"تيماء",id:136,govId:6},{name:"جنوب سعد العبدالله",id:135,govId:6},{name:"سعد العبدالله",id:44,govId:6},{name:"كبد",id:131,govId:6},
];

const FEATURES = [
  { icon: <ShieldCheck size={26} strokeWidth={2} />, label: "مكاتب موثوقة ومرخّصة", desc: "كل الإعلانات من مكاتب عقارية حقيقية تمت مراجعتها", color: "#3F5BD8", bg: "#EEF2FF" },
  { icon: <Search size={26} strokeWidth={2} />, label: "بحث سريع ودقيق", desc: "فلتر حسب النوع والمنطقة والميزانية في ثوانٍ", color: "#059669", bg: "#ECFDF5" },
  { icon: <MessageCircle size={26} strokeWidth={2} />, label: "تواصل مباشر", desc: "كلّم المكتب مباشرة عبر واتساب أو اتصال بدون وسيط", color: "#D97706", bg: "#FEF3C7" },
  { icon: <MapPin size={26} strokeWidth={2} />, label: "كل الكويت في مكان واحد", desc: "تصفّح جميع المحافظات والمناطق من شاشة واحدة", color: "#DC2626", bg: "#FFF1F2" },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [status, setStatus]     = useState("للإيجار");
  const [province, setProvince] = useState<string>("");
  const [area, setArea]         = useState<string>("");
  const [type, setType]         = useState<string>("");

  const availableTypes  = TYPES_BY_STATUS[status] ?? TYPES_BY_STATUS["للإيجار"];
  const provinces       = Object.keys(AREAS);
  const areasByProvince = province ? AREAS[province] ?? [] : [];

  const { data: latest } = useGetLatestProperties({ limit: 8 } as any);
  const { data: offices } = useGetFeaturedOffices();
  const { data: stats } = useGetPlatformStats();

  const latestList = (latest as any[]) ?? [];
  const officeList = (offices as any[]) ?? [];

  // ── Admin-managed hero banners ──
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    fetch(`${HOME_BASE}/api/hero-slides`)
      .then(r => r.json())
      .then(d => setSlides(Array.isArray(d?.slides) ? d.slides : []))
      .catch(() => setSlides([]));
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setSlideIdx(i => (i + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, [slides.length]);

  const current = slides[slideIdx] ?? null;
  const heroTitle = current?.title || "لاقِ عقارك من مكاتب موثوقة";
  const heroSubtitle = current?.subtitle || "آلاف العقارات للبيع والإيجار والبدل من مكاتب عقارية مرخّصة — كل الكويت في مكان واحد";

  // ── Scroll-reveal: fade sections in as they enter the viewport ──
  useEffect(() => {
    const els = document.querySelectorAll(".fh-reveal");
    if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, [latestList.length, officeList.length]);

  function handleStatusChange(s: string) { setStatus(s); setType(""); }

  const [sheetOpen, setSheetOpen]                   = useState<"type" | "gov" | "area" | null>(null);
  const [sheetQuery, setSheetQuery]                 = useState("");
  const [sheetSearchVisible, setSheetSearchVisible] = useState(false);
  const sheetInputRef = useRef<HTMLInputElement>(null);

  const sheetItems =
    sheetOpen === "type" ? availableTypes.map(t => ({ value: t, label: t })) :
    sheetOpen === "gov"  ? provinces.map(p => ({ value: p, label: p })) :
    sheetOpen === "area" ? areasByProvince.map(a => ({ value: a, label: a })) : [];

  const filteredSheetItems = sheetQuery.trim()
    ? sheetItems.filter(i => i.label.includes(sheetQuery.trim()))
    : sheetItems;

  const currentSheetValue =
    sheetOpen === "type" ? type :
    sheetOpen === "gov"  ? province :
    sheetOpen === "area" ? area : "";

  function openSheet(which: "type" | "gov" | "area") {
    setSheetQuery(""); setSheetSearchVisible(false); setSheetOpen(which);
    const y = window.scrollY;
    document.body.dataset.sheetScrollY = String(y);
    document.body.style.position = "fixed";
    document.body.style.top = `-${y}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
  }

  function closeSheet() {
    const y = parseInt(document.body.dataset.sheetScrollY ?? "0");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
    window.scrollTo(0, y);
    setSheetOpen(null); setSheetQuery(""); setSheetSearchVisible(false);
  }

  function showSheetSearch() {
    setSheetSearchVisible(true);
    setTimeout(() => sheetInputRef.current?.focus(), 60);
  }

  function handleSheetSelect(value: string) {
    if (sheetOpen === "type") {
      const v = value === type ? "" : value;
      setType(v); closeSheet();
      if (v) setTimeout(() => openSheet("gov"), 220);
    } else if (sheetOpen === "gov") {
      const v = value === province ? "" : value;
      setProvince(v); setArea(""); closeSheet();
      if (v) setTimeout(() => openSheet("area"), 220);
    } else if (sheetOpen === "area") {
      setArea(value === area ? "" : value); closeSheet();
    }
  }

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (province) params.append("governorateId", String(GOV_ID[province] ?? ""));
    if (area && province) {
      const e = _AREA_ID.find(a => a.name === area && a.govId === GOV_ID[province]);
      if (e) params.append("areaId", String(e.id));
    }
    if (type) params.append("type", type);
    setLocation(`/properties?${params.toString()}`);
  };

  return (
    <MainLayout>
      <style>{`
        body { background: #F6F8FC !important; }
        .fh-wrap { direction: rtl; font-family: 'Cairo', sans-serif; }
        .fh-wrap *::selection { background: rgba(63,91,216,0.16); }

        /* ===== HERO ===== */
        .fh-hero {
          position: relative;
          background:
            radial-gradient(circle at 18% 12%, rgba(99,130,246,0.28) 0, transparent 42%),
            radial-gradient(circle at 88% 8%, rgba(63,91,216,0.32) 0, transparent 40%),
            radial-gradient(circle at 50% 120%, rgba(99,130,246,0.20) 0, transparent 55%),
            linear-gradient(150deg, #16203A 0%, #1F2A44 45%, #2E3E72 78%, #3F5BD8 100%);
          padding: 60px 16px 132px;
          text-align: center;
          overflow: hidden;
        }
        /* live image background (admin banners / default) */
        .fh-hero-bg { position:absolute; inset:0; z-index:0; }
        .fh-hero-slide {
          position:absolute; inset:0; background-size:cover; background-position:center;
          opacity:0; transition:opacity 1.1s ease; will-change:opacity, transform;
        }
        .fh-hero-slide.active { opacity:1; animation:fh-kenburns 14s ease-out forwards; }
        @keyframes fh-kenburns { from { transform:scale(1.04); } to { transform:scale(1.15); } }
        .fh-hero-overlay {
          position:absolute; inset:0; z-index:1; pointer-events:none;
          background:
            linear-gradient(180deg, rgba(16,22,40,0.34) 0%, rgba(16,22,40,0.30) 36%, rgba(19,26,48,0.82) 100%),
            radial-gradient(circle at 82% 4%, rgba(63,91,216,0.22) 0, transparent 48%);
        }
        .fh-hero-inner { z-index:3 !important; }
        /* CTA from admin banner */
        .fh-hero-cta {
          display:inline-flex; align-items:center; gap:8px; margin:0 0 26px;
          background:#fff; color:#1F2A44; font-weight:800; font-size:15px;
          padding:13px 26px; border-radius:999px; text-decoration:none;
          box-shadow:0 12px 30px rgba(0,0,0,0.28); transition:transform .18s, box-shadow .18s;
        }
        .fh-hero-cta:hover { transform:translateY(-2px); box-shadow:0 16px 38px rgba(0,0,0,0.34); }
        /* carousel dots */
        .fh-dots { display:flex; gap:8px; justify-content:center; margin-top:26px; }
        .fh-dot { width:9px; height:9px; border-radius:999px; border:none; cursor:pointer; background:rgba(255,255,255,0.4); transition:all .2s; padding:0; }
        .fh-dot.on { background:#fff; width:26px; }
        /* hero entrance */
        .fh-anim-1 { animation:fh-rise .7s cubic-bezier(.22,1,.36,1) both; }
        .fh-anim-2 { animation:fh-rise .7s cubic-bezier(.22,1,.36,1) .12s both; }
        .fh-anim-3 { animation:fh-rise .7s cubic-bezier(.22,1,.36,1) .24s both; }
        @keyframes fh-rise { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        /* scroll reveal */
        .fh-reveal { opacity:0; transform:translateY(26px); transition:opacity .6s ease, transform .6s cubic-bezier(.22,1,.36,1); }
        .fh-reveal.in { opacity:1; transform:translateY(0); }
        .fh-hero::before {
          content: ""; position: absolute; inset: 0;
          background-image:
            radial-gradient(circle at 20% 22%, rgba(255,255,255,0.10) 0, transparent 38%),
            radial-gradient(circle at 82% 4%, rgba(255,255,255,0.07) 0, transparent 34%);
          pointer-events: none;
        }
        .fh-hero::after {
          content: ""; position: absolute; left:0; right:0; bottom:0; height:140px;
          background: linear-gradient(180deg, transparent, rgba(246,248,252,0));
          pointer-events: none;
        }
        .fh-hero-inner { position: relative; max-width: 740px; margin: 0 auto; z-index: 1; }
        .fh-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.10); color: #EAF0FF;
          padding: 7px 16px; border-radius: 999px; font-size: 12.5px; font-weight: 700;
          margin-bottom: 18px; backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.16);
          box-shadow: 0 4px 16px rgba(15,23,42,0.18);
        }
        .fh-headline { font-size: 31px; font-weight: 800; color: #fff; margin: 0 0 12px; line-height: 1.35; letter-spacing: -0.6px; text-shadow: 0 2px 20px rgba(0,0,0,0.5); }
        .fh-headline .hl { background: linear-gradient(90deg, #C7D2FE, #fff); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .fh-subtitle { font-size: 15px; color: rgba(243,247,255,0.94); margin: 0 0 30px; line-height: 1.75; max-width: 560px; margin-inline: auto; text-shadow: 0 1px 12px rgba(0,0,0,0.45); }

        /* ===== SEARCH CARD ===== */
        .fh-card { position:relative; background:#fff; border-radius:22px; padding:20px; box-shadow:0 24px 60px rgba(15,23,42,0.28), 0 4px 14px rgba(15,23,42,0.10); text-align:right; max-width: 580px; margin: 0 auto; border:1px solid rgba(255,255,255,0.6); }
        .fh-tabs { display:flex; gap:8px; margin-bottom:16px; background:#F1F5F9; padding:5px; border-radius:14px; }
        .fh-tab { flex:1; padding:11px 6px; border-radius:10px; border:none; background:transparent; font-size:14px; font-weight:700; color:#64748B; cursor:pointer; transition:all .18s ease; font-family:inherit; }
        .fh-tab:hover { color:#3F5BD8; }
        .fh-tab.active { background:#fff; color:#1F2A44; box-shadow:0 4px 12px rgba(15,23,42,0.10); }
        .fh-fields { display:flex; flex-direction:column; gap:10px; margin-bottom:14px; }
        .fh-field { width:100%; height:52px; border:1.5px solid #E6EAF1; border-radius:13px; background:#F8FAFC; display:flex; align-items:center; justify-content:space-between; padding:0 15px; font-size:15px; font-weight:600; color:#1F2A44; cursor:pointer; font-family:inherit; transition:border-color .18s, background .18s, box-shadow .18s; }
        .fh-field:hover:not(:disabled) { border-color:#C7D2FE; }
        .fh-field.filled { border-color:#3F5BD8; background:#EEF4FF; box-shadow:0 2px 8px rgba(63,91,216,0.12); }
        .fh-field:disabled { opacity:.5; cursor:not-allowed; }
        .fh-field .ph { color:#94A3B8; font-weight:500; }
        .fh-search-btn { width:100%; height:54px; border:none; border-radius:14px; background:linear-gradient(135deg,#3F5BD8,#3349C0); color:#fff; font-size:16px; font-weight:800; cursor:pointer; font-family:inherit; box-shadow:0 10px 24px rgba(63,91,216,0.36); display:flex; align-items:center; justify-content:center; gap:8px; transition:transform .18s, box-shadow .18s; letter-spacing:-0.2px; }
        .fh-search-btn:hover { transform:translateY(-2px); box-shadow:0 14px 30px rgba(63,91,216,0.44); }
        .fh-search-btn:active { transform:translateY(0); }
        @media (min-width:769px){ .fh-fields{ flex-direction:row; } }

        /* trust row */
        .fh-trust { display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:8px 18px; margin-top:22px; }
        .fh-trust span { display:inline-flex; align-items:center; gap:6px; color:rgba(231,237,250,0.78); font-size:13px; font-weight:600; }
        .fh-trust .dot { width:4px; height:4px; border-radius:50%; background:rgba(255,255,255,0.35); }

        /* ===== STATS STRIP ===== */
        .fh-stats { position:relative; z-index:2; margin:-74px auto 0; max-width:780px; padding:0 16px; }
        .fh-stats-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:14px; }
        .fh-stat { display:flex; flex-direction:column; align-items:center; gap:4px; background:#fff; border:1px solid #EDF1F7; border-radius:18px; padding:20px 12px; text-align:center; box-shadow:0 10px 30px rgba(15,23,42,0.06); transition:transform .2s, box-shadow .2s; }
        .fh-stat:hover { transform:translateY(-3px); box-shadow:0 16px 38px rgba(15,23,42,0.10); }
        .fh-stat-ic { width:38px; height:38px; border-radius:11px; background:#EEF2FF; color:#3F5BD8; display:flex; align-items:center; justify-content:center; margin-bottom:4px; }
        .fh-stat-num { font-size:25px; font-weight:800; color:#1F2A44; line-height:1; letter-spacing:-0.5px; }
        .fh-stat-lbl { font-size:13px; color:#64748B; margin-top:4px; font-weight:600; }

        /* ===== SECTIONS ===== */
        .fh-section { max-width:1180px; margin:0 auto; padding:48px 16px 0; }
        .fh-sec-head { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:20px; }
        .fh-sec-titlewrap { display:flex; flex-direction:column; gap:8px; }
        .fh-sec-accent { width:42px; height:4px; border-radius:999px; background:linear-gradient(90deg,#3F5BD8,#7C8FF0); }
        .fh-sec-title { font-size:23px; font-weight:800; color:#1F2A44; margin:0; letter-spacing:-0.5px; }
        .fh-sec-link { font-size:14px; font-weight:700; color:#3F5BD8; display:inline-flex; align-items:center; gap:5px; padding:7px 14px; border-radius:999px; background:#EEF2FF; transition:background .18s, gap .18s; white-space:nowrap; }
        .fh-sec-link:hover { background:#E0E7FF; gap:9px; }
        .fh-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:16px; }
        @media (min-width:700px){ .fh-grid{ grid-template-columns:repeat(3, minmax(0, 1fr)); } }
        @media (min-width:1024px){ .fh-grid{ grid-template-columns:repeat(4, minmax(0, 1fr)); } }

        /* gov chips */
        .fh-gov-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:14px; }
        @media (min-width:700px){ .fh-gov-grid{ grid-template-columns:repeat(3, minmax(0, 1fr)); } }
        @media (min-width:1024px){ .fh-gov-grid{ grid-template-columns:repeat(6, minmax(0, 1fr)); } }
        .fh-gov { background:#fff; border:1px solid #EDF1F7; border-radius:18px; padding:22px 10px; text-align:center; cursor:pointer; transition:transform .2s, box-shadow .2s, border-color .2s; display:flex; flex-direction:column; align-items:center; gap:10px; }
        .fh-gov:hover { border-color:#C7D2FE; box-shadow:0 14px 32px rgba(15,23,42,0.10); transform:translateY(-3px); }
        .fh-gov-ic { width:50px; height:50px; border-radius:14px; background:linear-gradient(135deg,#EEF2FF,#E0E7FF); display:flex; align-items:center; justify-content:center; color:#3F5BD8; transition:transform .2s; }
        .fh-gov:hover .fh-gov-ic { transform:scale(1.08); }
        .fh-gov-name { font-size:14.5px; font-weight:700; color:#1F2A44; }

        /* features */
        .fh-feat-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:16px; }
        @media (min-width:900px){ .fh-feat-grid{ grid-template-columns:repeat(4, minmax(0, 1fr)); } }
        .fh-feat { background:#fff; border:1px solid #EDF1F7; border-radius:20px; padding:26px 20px; text-align:center; box-shadow:0 10px 30px rgba(15,23,42,0.05); transition:transform .2s, box-shadow .2s; }
        .fh-feat:hover { transform:translateY(-3px); box-shadow:0 18px 40px rgba(15,23,42,0.10); }
        .fh-feat-ic { width:58px; height:58px; border-radius:16px; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; box-shadow:0 6px 16px rgba(15,23,42,0.06); }
        .fh-feat h3 { font-size:16px; font-weight:800; color:#1F2A44; margin:0 0 7px; letter-spacing:-0.2px; }
        .fh-feat p { font-size:13.5px; color:#64748B; margin:0; line-height:1.65; }

        /* CTA */
        .fh-cta { max-width:1180px; margin:56px auto 0; padding:0 16px; }
        .fh-cta-box { position:relative; overflow:hidden; background:linear-gradient(125deg,#16203A 0%,#1F2A44 42%,#3F5BD8 100%); border-radius:26px; padding:52px 28px; text-align:center; box-shadow:0 24px 60px rgba(31,42,68,0.32); }
        .fh-cta-box::before { content:""; position:absolute; right:-60px; top:-60px; width:240px; height:240px; background:radial-gradient(circle, rgba(99,130,246,0.45), transparent 70%); border-radius:50%; }
        .fh-cta-box::after { content:""; position:absolute; left:-50px; bottom:-50px; width:200px; height:200px; background:rgba(255,255,255,0.06); border-radius:50%; }
        .fh-cta-inner { position:relative; z-index:1; max-width:620px; margin:0 auto; }
        .fh-cta-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.18); color:#EAF0FF; padding:6px 14px; border-radius:999px; font-size:12.5px; font-weight:700; margin-bottom:16px; }
        .fh-cta h2 { color:#fff; font-size:27px; font-weight:800; margin:0 0 12px; letter-spacing:-0.5px; line-height:1.4; }
        .fh-cta p { color:rgba(231,237,250,0.86); font-size:15px; margin:0 0 26px; line-height:1.75; }
        .fh-cta-btn { display:inline-flex; align-items:center; gap:8px; background:#fff; color:#1F2A44; font-weight:800; font-size:15px; padding:15px 30px; border-radius:999px; text-decoration:none; box-shadow:0 12px 28px rgba(0,0,0,0.22); transition:transform .2s, box-shadow .2s; }
        .fh-cta-btn:hover { transform:translateY(-2px); box-shadow:0 16px 34px rgba(0,0,0,0.28); }

        @media (min-width:769px){
          .fh-hero{ padding:80px 24px 140px; }
          .fh-headline{ font-size:46px; }
          .fh-subtitle{ font-size:17px; }
          .fh-stat-num{ font-size:31px; }
          .fh-cta h2{ font-size:31px; }
        }

        /* sheet */
        .fh-sheet-wrap { position:fixed; inset:0; z-index:9999; display:flex; flex-direction:column; justify-content:flex-end; }
        .fh-sheet { position:relative; background:#fff; border-radius:22px 22px 0 0; height:80vh; display:flex; flex-direction:column; box-shadow:0 -8px 40px rgba(0,0,0,0.16); }
        @media (min-width:769px){ .fh-sheet-wrap{ justify-content:center; align-items:center; } .fh-sheet{ border-radius:20px; height:auto; max-height:70vh; width:420px; } .fh-sheet-handle{ display:none; } }
        .fh-sheet-item { width:100%; display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border:none; border-bottom:1px solid #F1F5F9; cursor:pointer; font-size:15px; color:#1E293B; background:transparent; text-align:right; font-family:inherit; }
        .fh-sheet-item:active { background:#F1F5F9; }
        .fh-sheet-item.sel { background:#EEF4FF; color:#3F5BD8; font-weight:700; }
      `}</style>

      <div className="fh-wrap">
        {/* ===== HERO + SEARCH ===== */}
        <section className="fh-hero">
          <div className="fh-hero-bg">
            {(slides.length ? slides : [{ id: 0, imageUrl: DEFAULT_HERO_IMG } as HeroSlide]).map((s, i) => (
              <div
                key={s.id}
                className={`fh-hero-slide${i === slideIdx ? " active" : ""}`}
                style={{ backgroundImage: `url(${s.imageUrl})` }}
              />
            ))}
          </div>
          <div className="fh-hero-overlay" />

          <div className="fh-hero-inner">
            <span className="fh-eyebrow"><ShieldCheck size={14} /> منصة العقارات الأولى للمكاتب في الكويت</span>
            <h1 className="fh-headline fh-anim-1">
              {current?.title ? current.title : <>لاقِ عقارك من <span className="hl">مكاتب موثوقة</span></>}
            </h1>
            <p className="fh-subtitle fh-anim-2">{heroSubtitle}</p>

            {current?.ctaText && current?.ctaUrl && (
              current.ctaUrl.startsWith("/") ? (
                <Link href={current.ctaUrl} className="fh-hero-cta fh-anim-2">{current.ctaText} <ArrowLeft size={17} /></Link>
              ) : (
                <a href={current.ctaUrl} target="_blank" rel="noopener noreferrer" className="fh-hero-cta fh-anim-2">{current.ctaText} <ArrowLeft size={17} /></a>
              )
            )}

            <div className="fh-card fh-anim-3">
              <div className="fh-tabs">
                {["للإيجار", "للبيع", "للبدل"].map(s => (
                  <button key={s} className={`fh-tab${status === s ? " active" : ""}`} onClick={() => handleStatusChange(s)}>{s}</button>
                ))}
              </div>
              <div className="fh-fields">
                <button className={`fh-field${type ? " filled" : ""}`} onClick={() => openSheet("type")}>
                  <span className={type ? "" : "ph"}>{type || "نوع العقار"}</span>
                  <ChevronDown size={17} color={type ? "#3F5BD8" : "#94A3B8"} />
                </button>
                <button className={`fh-field${province ? " filled" : ""}`} onClick={() => openSheet("gov")}>
                  <span className={province ? "" : "ph"}>{province || "المحافظة"}</span>
                  <ChevronDown size={17} color={province ? "#3F5BD8" : "#94A3B8"} />
                </button>
                <button className={`fh-field${area ? " filled" : ""}`} onClick={() => { if (province) openSheet("area"); }} disabled={!province}>
                  <span className={area ? "" : "ph"}>{area || (province ? "المنطقة" : "اختر المحافظة")}</span>
                  <ChevronDown size={17} color={area ? "#3F5BD8" : "#94A3B8"} />
                </button>
              </div>
              <button className="fh-search-btn" onClick={handleSearch}><Search size={18} /> ابحث الآن</button>
            </div>

            <div className="fh-trust">
              <span><ShieldCheck size={15} /> مكاتب موثّقة</span>
              <i className="dot" />
              <span><TrendingUp size={15} /> عقارات محدّثة يوميًا</span>
              <i className="dot" />
              <span><MessageCircle size={15} /> تواصل مباشر بدون وسيط</span>
            </div>

            {slides.length > 1 && (
              <div className="fh-dots">
                {slides.map((_, i) => (
                  <button key={i} className={`fh-dot${i === slideIdx ? " on" : ""}`} onClick={() => setSlideIdx(i)} aria-label={`بانر ${i + 1}`} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ===== STATS ===== */}
        <div className="fh-stats">
          <div className="fh-stats-grid">
            <div className="fh-stat"><div className="fh-stat-ic"><Building2 size={19} /></div><div className="fh-stat-num">{(stats?.totalProperties ?? 0).toLocaleString("en-US")}+</div><div className="fh-stat-lbl">عقار معروض</div></div>
            <div className="fh-stat"><div className="fh-stat-ic"><ShieldCheck size={19} /></div><div className="fh-stat-num">{(stats?.totalOffices ?? 0).toLocaleString("en-US")}+</div><div className="fh-stat-lbl">مكتب موثوق</div></div>
            <div className="fh-stat"><div className="fh-stat-ic"><MapPin size={19} /></div><div className="fh-stat-num">{stats?.totalCities ?? 6}</div><div className="fh-stat-lbl">محافظات</div></div>
          </div>
        </div>

        {/* ===== LATEST PROPERTIES ===== */}
        {latestList.length > 0 && (
          <section className="fh-section fh-reveal">
            <div className="fh-sec-head">
              <div className="fh-sec-titlewrap"><span className="fh-sec-accent" /><h2 className="fh-sec-title">أحدث العقارات</h2></div>
              <Link href="/properties" className="fh-sec-link">عرض الكل <ArrowLeft size={15} /></Link>
            </div>
            <div className="fh-grid">
              {latestList.slice(0, 8).map((p: any) => <PropertyCard key={p.id} property={p} />)}
            </div>
          </section>
        )}

        {/* ===== BROWSE BY GOVERNORATE ===== */}
        <section className="fh-section fh-reveal">
          <div className="fh-sec-head"><div className="fh-sec-titlewrap"><span className="fh-sec-accent" /><h2 className="fh-sec-title">تصفّح حسب المحافظة</h2></div></div>
          <div className="fh-gov-grid">
            {Object.entries(GOV_ID).map(([name, id]) => (
              <Link key={id} href={`/properties?governorateId=${id}`} className="fh-gov">
                <div className="fh-gov-ic"><MapPin size={22} /></div>
                <div className="fh-gov-name">{name}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ===== WHY FINDE ===== */}
        <section className="fh-section fh-reveal">
          <div className="fh-sec-head"><div className="fh-sec-titlewrap"><span className="fh-sec-accent" /><h2 className="fh-sec-title">ليه فايند؟</h2></div></div>
          <div className="fh-feat-grid">
            {FEATURES.map(f => (
              <div key={f.label} className="fh-feat">
                <div className="fh-feat-ic" style={{ background: f.bg, color: f.color }}>{f.icon}</div>
                <h3>{f.label}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== TRUSTED OFFICES ===== */}
        {officeList.length > 0 && (
          <section className="fh-section fh-reveal">
            <div className="fh-sec-head">
              <div className="fh-sec-titlewrap"><span className="fh-sec-accent" /><h2 className="fh-sec-title">مكاتب موثوقة</h2></div>
              <Link href="/offices" className="fh-sec-link">كل المكاتب <ArrowLeft size={15} /></Link>
            </div>
            <div className="fh-grid">
              {officeList.slice(0, 4).map((o: any) => <OfficeCard key={o.id} office={o} />)}
            </div>
          </section>
        )}

        {/* ===== OFFICE CTA ===== */}
        <section className="fh-cta fh-reveal">
          <div className="fh-cta-box">
            <div className="fh-cta-inner">
              <span className="fh-cta-pill"><Star size={13} /> مجاني بالكامل</span>
              <h2>عندك مكتب عقاري؟ اعرض عقاراتك على فايند</h2>
              <p>سجّل مكتبك مجانًا، احصل على صفحة هبوط احترافية برابط خاص، وابدأ تستقبل العملاء مباشرة.</p>
              <Link href="/register" className="fh-cta-btn">أضف مكتبك مجانًا <ArrowLeft size={16} /></Link>
            </div>
          </div>
        </section>

        <div style={{ height: 48 }} />
      </div>

      {/* ===== SHEET ===== */}
      {sheetOpen && (
        <div className="fh-sheet-wrap">
          <div onClick={closeSheet} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.50)" }} />
          <div dir="rtl" className="fh-sheet">
            <div className="fh-sheet-handle" style={{ width: 40, height: 4, background: "#E2E8F0", borderRadius: 2, margin: "14px auto 0", flexShrink: 0 }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 10px", borderBottom: "1px solid #F1F5F9", flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1F2A44", fontFamily: "'Cairo', sans-serif" }}>
                {sheetOpen === "type" ? "نوع العقار" : sheetOpen === "gov" ? "المحافظة" : "المنطقة"}
              </h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {!sheetSearchVisible && (
                  <button onClick={showSheetSearch} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#F1F5F9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Search size={15} color="#64748B" /></button>
                )}
                <button onClick={closeSheet} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#F1F5F9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} color="#64748B" /></button>
              </div>
            </div>
            {sheetSearchVisible && (
              <div style={{ padding: "10px 16px 6px", flexShrink: 0, borderBottom: "1px solid #F1F5F9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F1F5F9", borderRadius: 12, padding: "0 12px" }}>
                  <Search size={15} color="#94A3B8" />
                  <input ref={sheetInputRef} type="text" inputMode="search" value={sheetQuery} onChange={e => setSheetQuery(e.target.value)} placeholder="ابحث..." dir="rtl"
                    style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 15, padding: "10px 0", fontFamily: "'Cairo', sans-serif", color: "#0F172A" }} />
                  {sheetQuery && <button onClick={() => setSheetQuery("")} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} color="#94A3B8" /></button>}
                </div>
              </div>
            )}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {filteredSheetItems.map(item => (
                <button key={item.value} className={`fh-sheet-item${item.value === currentSheetValue ? " sel" : ""}`} onClick={() => handleSheetSelect(item.value)}>
                  <span>{item.label}</span>
                  {item.value === currentSheetValue && <Check size={16} color="#3F5BD8" />}
                </button>
              ))}
              {filteredSheetItems.length === 0 && <p style={{ textAlign: "center", color: "#94A3B8", padding: "32px 20px", fontFamily: "'Cairo', sans-serif", fontSize: 14 }}>لا توجد نتائج</p>}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
