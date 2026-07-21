import MainLayout from "@/components/layout/MainLayout";
import { Link, useLocation } from "wouter";
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Check, Search, ArrowLeft, Building2, MapPin, MessageCircle, ShieldCheck, TrendingUp, Star } from "lucide-react";
import { PropertyCard } from "@/components/PropertyCard";
import { getApiBase } from "@/lib/apiBase";
import {
  useGetLatestProperties,
  useGetPlatformStats,
  useListGovernorates,
  useListAreas,
} from "@workspace/api-client-react";

const HOME_BASE = getApiBase();
const DEFAULT_HERO_IMG = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1920&q=70";

interface HeroSlide { id: number; imageUrl: string; title: string | null; subtitle: string | null; ctaText: string | null; ctaUrl: string | null; }

const TYPES_BY_STATUS: Record<string, string[]> = {
  "للإيجار": ["بيت", "قسيمة", "ارض", "دور", "شقة", "محل", "مكتب", "مخزن", "شاليه", "استراحة", "مزرعة", "عمارة", "مجمع", "قسيمة صناعية", "قسيمة حرفية"],
  "للبيع":   ["بيت", "قسيمة", "ارض", "دور", "شقة", "محل", "مكتب", "مخزن", "شاليه", "استراحة", "مزرعة", "عمارة", "مجمع", "قسيمة صناعية", "قسيمة حرفية"],
  "للبدل":   ["بيت", "قسيمة", "ارض", "شقة", "طلب"],
};

// One restrained accent across all feature cards (el-captin-style: few colors).
const FEAT_COLOR = "#667EEA";
const FEAT_BG = "#EEF2FF";
const FEATURES = [
  { icon: <Building2 size={26} strokeWidth={2} />, label: "مكاتب عقارية مرخّصة", desc: "كل الإعلانات من مكاتب عقارية مرخّصة في دولة الكويت", color: FEAT_COLOR, bg: FEAT_BG },
  { icon: <Search size={26} strokeWidth={2} />, label: "بحث سريع ودقيق", desc: "فلتر حسب النوع والمنطقة والميزانية في ثوانٍ", color: FEAT_COLOR, bg: FEAT_BG },
  { icon: <MessageCircle size={26} strokeWidth={2} />, label: "تواصل مباشر", desc: "تواصل مع المكتب مباشرة عبر واتساب أو اتصال", color: FEAT_COLOR, bg: FEAT_BG },
  { icon: <MapPin size={26} strokeWidth={2} />, label: "كل الكويت في مكان واحد", desc: "تصفّح جميع المحافظات والمناطق من شاشة واحدة", color: FEAT_COLOR, bg: FEAT_BG },
];

export default function Home() {
  const [, setLocation] = useLocation();
  // Home search is deliberately single-select: pick a type and the governorate
  // sheet opens itself, pick a governorate and the areas open, pick an area and
  // you're done — the client's signature fast flow ("ما في أي موقع يعمل كده").
  // Multi-select lives on the /properties page (areas only), not here.
  const [status, setStatus]     = useState("للإيجار");
  const [govId, setGovId]       = useState<string>("");
  const [areaId, setAreaId]     = useState<string>("");
  const [type, setType]         = useState<string>("");

  const availableTypes  = TYPES_BY_STATUS[status] ?? TYPES_BY_STATUS["للإيجار"];

  // Governorates + areas come from the DB so admin edits show up in search immediately.
  const { data: govList } = useListGovernorates();
  const { data: areaList } = useListAreas(
    { governorateId: govId ? Number(govId) : undefined } as any,
    { query: { enabled: !!govId } }
  );
  const govName = (id: string) =>
    (govList ?? []).find((g) => String(g.id) === id)?.nameAr.replace("محافظة ", "") ?? "";
  const areaName = (id: string) =>
    (areaList ?? []).find((a) => String(a.id) === id)?.nameAr ?? "";

  const { data: latest } = useGetLatestProperties({ limit: 8 } as any);
  const { data: stats } = useGetPlatformStats();

  const latestList = (latest as any[]) ?? [];

  // Store the visible listing IDs so the property page can offer السابق/التالي navigation.
  useEffect(() => {
    if (latestList.length > 0) {
      try { localStorage.setItem("aqar_search_ids", JSON.stringify(latestList.slice(0, 8).map((p: any) => p.id))); } catch {}
    }
  }, [latestList]);

  // ── Admin-managed hero banners ──
  const [slides, setSlides] = useState<HeroSlide[]>([]);

  useEffect(() => {
    fetch(`${HOME_BASE}/api/hero-slides`)
      .then(r => r.json())
      .then(d => setSlides(Array.isArray(d?.slides) ? d.slides : []))
      .catch(() => setSlides([]));
  }, []);

  const current = slides[0] ?? null;
  const heroSubtitle = current?.subtitle || "آلاف العقارات للبيع والإيجار والبدل من مكاتب عقارية — كل الكويت في مكان واحد";

  // ── Scroll-reveal: fade sections in as they enter the viewport ──
  useEffect(() => {
    const els = document.querySelectorAll(".fh-reveal");
    if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, [latestList.length]);

  // Auto-cycle the search tabs to draw attention, until the user picks one.
  const [userPickedStatus, setUserPickedStatus] = useState(false);
  useEffect(() => {
    if (userPickedStatus) return;
    const order = ["للإيجار", "للبيع", "للبدل"];
    const t = setInterval(() => {
      setStatus((prev) => order[(order.indexOf(prev) + 1) % order.length]);
    }, 2000);
    return () => clearInterval(t);
  }, [userPickedStatus]);

  function handleStatusChange(s: string) { setUserPickedStatus(true); setStatus(s); setType(""); }

  const [sheetOpen, setSheetOpen]                   = useState<"type" | "gov" | "area" | null>(null);
  const [sheetQuery, setSheetQuery]                 = useState("");
  const [sheetSearchVisible, setSheetSearchVisible] = useState(false);
  const sheetInputRef = useRef<HTMLInputElement>(null);

  const sheetItems =
    sheetOpen === "type" ? availableTypes.map(t => ({ value: t, label: t })) :
    sheetOpen === "gov"  ? (govList ?? []).map(g => ({ value: String(g.id), label: g.nameAr.replace("محافظة ", "") })) :
    sheetOpen === "area" ? (areaList ?? []).map(a => ({ value: String(a.id), label: a.nameAr })) : [];

  const filteredSheetItems = sheetQuery.trim()
    ? sheetItems.filter(i => i.label.includes(sheetQuery.trim()))
    : sheetItems;

  const sheetSelectedValues =
    sheetOpen === "type" ? (type ? [type] : []) :
    sheetOpen === "gov"  ? (govId ? [govId] : []) :
    sheetOpen === "area" ? (areaId ? [areaId] : []) : [];

  function openSheet(which: "type" | "gov" | "area") {
    setUserPickedStatus(true); // stop the status auto-carousel once the user starts choosing
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

  // The cascade: each pick closes its sheet and opens the next step, so the
  // whole search is type → governorate → area → ابحث in four taps.
  function handleSheetSelect(value: string) {
    if (sheetOpen === "type") {
      const v = value === type ? "" : value;
      setType(v); closeSheet();
      if (v && !govId) setTimeout(() => openSheet("gov"), 220);
    } else if (sheetOpen === "gov") {
      const v = value === govId ? "" : value;
      setGovId(v); setAreaId(""); closeSheet();
      if (v) setTimeout(() => openSheet("area"), 220);
    } else if (sheetOpen === "area") {
      setAreaId(value === areaId ? "" : value); closeSheet();
    }
  }

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (govId) params.append("governorateId", govId);
    if (areaId && govId) params.append("areaId", areaId);
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
            linear-gradient(150deg, #16203A 0%, #111827 45%, #2E3E72 78%, #667EEA 100%);
          padding: 60px 16px 132px;
          text-align: center;
          overflow: hidden;
        }
        /* live image background (admin banners / default) */
        .fh-hero-bg { position:absolute; inset:0; z-index:0; }
        .fh-hero-slide {
          position:absolute; inset:0; background-size:cover; background-position:center;
          opacity:1; transform:scale(1.04); filter:blur(1px); will-change:auto;
        }
        .fh-hero-slide.active { opacity:1; }
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
          background:#fff; color:#111827; font-weight:800; font-size:15px;
          padding:13px 26px; border-radius:999px; text-decoration:none;
          box-shadow:0 6px 18px rgba(0,0,0,0.18); transition:transform .18s, box-shadow .18s;
        }
        .fh-hero-cta:hover { transform:translateY(-2px); box-shadow:0 10px 24px rgba(0,0,0,0.22); }
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
        .fh-card { position:relative; background:#fff; border-radius:22px; padding:20px; box-shadow:0 16px 40px rgba(15,23,42,0.16), 0 2px 8px rgba(15,23,42,0.05); text-align:right; max-width: 580px; margin: 0 auto; border:1px solid rgba(255,255,255,0.6); }
        .fh-tabs { display:flex; gap:8px; margin-bottom:16px; background:#F1F5F9; padding:5px; border-radius:14px; }
        .fh-tab { flex:1; padding:11px 6px; border-radius:10px; border:none; background:transparent; font-size:14px; font-weight:700; color:#64748B; cursor:pointer; transition:all .18s ease; font-family:inherit; }
        .fh-tab:hover { color:#667EEA; }
        .fh-tab.active { background:#667EEA; color:#fff; box-shadow:0 6px 16px rgba(102,126,234,0.35); }
        .fh-tab.active:hover { color:#fff; }
        .fh-fields { display:flex; flex-direction:column; gap:10px; margin-bottom:14px; }
        .fh-field { width:100%; height:52px; border:1.5px solid #E6EAF1; border-radius:13px; background:#F8FAFC; display:flex; align-items:center; justify-content:space-between; padding:0 15px; font-size:15px; font-weight:600; color:#111827; cursor:pointer; font-family:inherit; transition:border-color .18s, background .18s, box-shadow .18s; }
        .fh-field:hover:not(:disabled) { border-color:#C7D2FE; }
        .fh-field.filled { border-color:#667EEA; background:#EEF4FF; box-shadow:0 2px 8px rgba(63,91,216,0.12); }
        .fh-field:disabled { opacity:.5; cursor:not-allowed; }
        .fh-field .ph { color:#94A3B8; font-weight:500; }
        .fh-search-btn { width:100%; height:54px; border:none; border-radius:14px; background:linear-gradient(135deg,#667EEA,#3349C0); color:#fff; font-size:16px; font-weight:800; cursor:pointer; font-family:inherit; box-shadow:0 6px 16px rgba(63,91,216,0.22); display:flex; align-items:center; justify-content:center; gap:8px; transition:transform .18s, box-shadow .18s; letter-spacing:-0.2px; }
        .fh-search-btn:hover { transform:translateY(-2px); box-shadow:0 10px 22px rgba(63,91,216,0.30); }
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
        .fh-stat-ic { width:38px; height:38px; border-radius:11px; background:#EEF2FF; color:#667EEA; display:flex; align-items:center; justify-content:center; margin-bottom:4px; }
        .fh-stat-num { font-size:25px; font-weight:800; color:#111827; line-height:1; letter-spacing:-0.5px; }
        .fh-stat-lbl { font-size:13px; color:#64748B; margin-top:4px; font-weight:600; }

        /* ===== SECTIONS ===== */
        .fh-section { max-width:1180px; margin:0 auto; padding:48px 16px 0; }
        .fh-sec-head { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:20px; }
        .fh-sec-titlewrap { display:flex; flex-direction:column; gap:8px; }
        .fh-sec-accent { width:42px; height:4px; border-radius:999px; background:linear-gradient(90deg,#667EEA,#7C8FF0); }
        .fh-sec-title { font-size:23px; font-weight:800; color:#111827; margin:0; letter-spacing:-0.5px; }
        .fh-sec-link { font-size:14px; font-weight:700; color:#667EEA; display:inline-flex; align-items:center; gap:5px; padding:7px 14px; border-radius:999px; background:#EEF2FF; transition:background .18s, gap .18s; white-space:nowrap; }
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
        .fh-gov-ic { width:50px; height:50px; border-radius:14px; background:linear-gradient(135deg,#EEF2FF,#E0E7FF); display:flex; align-items:center; justify-content:center; color:#667EEA; transition:transform .2s; }
        .fh-gov:hover .fh-gov-ic { transform:scale(1.08); }
        .fh-gov-name { font-size:14.5px; font-weight:700; color:#111827; }

        /* features */
        .fh-feat-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:16px; }
        @media (min-width:900px){ .fh-feat-grid{ grid-template-columns:repeat(4, minmax(0, 1fr)); } }
        .fh-feat { background:#fff; border:1px solid #EDF1F7; border-radius:20px; padding:26px 20px; text-align:center; box-shadow:0 10px 30px rgba(15,23,42,0.05); transition:transform .2s, box-shadow .2s; }
        .fh-feat:hover { transform:translateY(-3px); box-shadow:0 18px 40px rgba(15,23,42,0.10); }
        .fh-feat-ic { width:58px; height:58px; border-radius:16px; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; box-shadow:0 6px 16px rgba(15,23,42,0.06); }
        .fh-feat h3 { font-size:16px; font-weight:800; color:#111827; margin:0 0 7px; letter-spacing:-0.2px; }
        .fh-feat p { font-size:13.5px; color:#64748B; margin:0; line-height:1.65; }

        /* CTA */
        .fh-cta { max-width:1180px; margin:56px auto 0; padding:0 16px; }
        .fh-cta-box { position:relative; overflow:hidden; background:linear-gradient(125deg,#16203A 0%,#111827 42%,#667EEA 100%); border-radius:26px; padding:52px 28px; text-align:center; box-shadow:0 16px 40px rgba(31,42,68,0.18); }
        .fh-cta-box::before { content:""; position:absolute; right:-60px; top:-60px; width:240px; height:240px; background:radial-gradient(circle, rgba(99,130,246,0.45), transparent 70%); border-radius:50%; }
        .fh-cta-box::after { content:""; position:absolute; left:-50px; bottom:-50px; width:200px; height:200px; background:rgba(255,255,255,0.06); border-radius:50%; }
        .fh-cta-inner { position:relative; z-index:1; max-width:620px; margin:0 auto; }
        .fh-cta-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.18); color:#EAF0FF; padding:6px 14px; border-radius:999px; font-size:12.5px; font-weight:700; margin-bottom:16px; }
        .fh-cta h2 { color:#fff; font-size:27px; font-weight:800; margin:0 0 12px; letter-spacing:-0.5px; line-height:1.4; }
        .fh-cta p { color:rgba(231,237,250,0.86); font-size:15px; margin:0 0 26px; line-height:1.75; }
        .fh-cta-btn { display:inline-flex; align-items:center; gap:8px; background:#fff; color:#111827; font-weight:800; font-size:15px; padding:15px 30px; border-radius:999px; text-decoration:none; box-shadow:0 6px 16px rgba(0,0,0,0.14); transition:transform .2s, box-shadow .2s; }
        .fh-cta-btn:hover { transform:translateY(-2px); box-shadow:0 10px 22px rgba(0,0,0,0.18); }

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
        /* bottom fade hints that the list scrolls (more options below) */
        .fh-sheet::after { content:""; position:absolute; left:0; right:0; bottom:0; height:46px; background:linear-gradient(rgba(255,255,255,0), #fff); pointer-events:none; z-index:2; }
        @media (min-width:769px){ .fh-sheet-wrap{ justify-content:center; align-items:center; } .fh-sheet{ border-radius:20px; height:auto; max-height:70vh; width:420px; } .fh-sheet-handle{ display:none; } }
        .fh-sheet-item { width:100%; display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border:none; border-bottom:1px solid #F1F5F9; cursor:pointer; font-size:15px; color:#1E293B; background:transparent; text-align:right; font-family:inherit; }
        .fh-sheet-item:active { background:#F1F5F9; }
        .fh-sheet-item.sel { background:#EEF4FF; color:#667EEA; font-weight:700; }
      `}</style>

      <div className="fh-wrap">
        {/* ===== HERO + SEARCH ===== */}
        <section className="fh-hero">
          <div className="fh-hero-bg">
            {[(slides[0] ?? { id: 0, imageUrl: DEFAULT_HERO_IMG } as HeroSlide)].map((s) => (
              <div
                key={s.id}
                className="fh-hero-slide active"
                style={{ backgroundImage: `url(${s.imageUrl || DEFAULT_HERO_IMG})` }}
              />
            ))}
          </div>
          <div className="fh-hero-overlay" />

          <div className="fh-hero-inner">
            <span className="fh-eyebrow"><ShieldCheck size={14} /> منصة العقارات الأولى للمكاتب في الكويت</span>
            <h1 className="fh-headline fh-anim-1">
              {current?.title ? current.title : <>ابحث عن عقارك لدى <span className="hl">مكاتب عقارية</span></>}
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
                  <ChevronDown size={17} color={type ? "#667EEA" : "#94A3B8"} />
                </button>
                <button className={`fh-field${govId ? " filled" : ""}`} onClick={() => openSheet("gov")}>
                  <span className={govId ? "" : "ph"}>{govId ? govName(govId) : "المحافظة"}</span>
                  <ChevronDown size={17} color={govId ? "#667EEA" : "#94A3B8"} />
                </button>
                <button className={`fh-field${areaId ? " filled" : ""}`} onClick={() => { if (govId) openSheet("area"); }} disabled={!govId}>
                  <span className={areaId ? "" : "ph"}>{areaId ? areaName(areaId) : (govId ? "المنطقة" : "اختر المحافظة")}</span>
                  <ChevronDown size={17} color={areaId ? "#667EEA" : "#94A3B8"} />
                </button>
              </div>
              <button className="fh-search-btn" onClick={handleSearch}><Search size={18} /> ابحث الآن</button>
            </div>

            <div className="fh-trust">
              <span><Building2 size={15} /> مكاتب عقارية</span>
              <i className="dot" />
              <span><TrendingUp size={15} /> عقارات محدّثة يوميًا</span>
              <i className="dot" />
              <span><MessageCircle size={15} /> تواصل مباشر مع المكاتب</span>
            </div>

          </div>
        </section>

        {/* ===== STATS ===== */}
        <div className="fh-stats">
          <div className="fh-stats-grid">
            <div className="fh-stat"><div className="fh-stat-ic"><Building2 size={19} /></div><div className="fh-stat-num">{(stats?.totalProperties ?? 0).toLocaleString("en-US")}+</div><div className="fh-stat-lbl">عقار معروض</div></div>
            <div className="fh-stat"><div className="fh-stat-ic"><Building2 size={19} /></div><div className="fh-stat-num">{(stats?.totalOffices ?? 0).toLocaleString("en-US")}+</div><div className="fh-stat-lbl">مكتب عقاري</div></div>
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
            {(govList ?? []).map((g) => (
              <Link key={g.id} href={`/properties?governorateId=${g.id}`} className="fh-gov">
                <div className="fh-gov-ic"><MapPin size={22} /></div>
                <div className="fh-gov-name">{g.nameAr.replace("محافظة ", "")}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ===== WHY FINDE ===== */}
        <section className="fh-section fh-reveal">
          <div className="fh-sec-head"><div className="fh-sec-titlewrap"><span className="fh-sec-accent" /><h2 className="fh-sec-title">لماذا فايند؟</h2></div></div>
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

        {/* ===== OFFICE CTA ===== */}
        <section className="fh-cta fh-reveal">
          <div className="fh-cta-box">
            <div className="fh-cta-inner">
              <span className="fh-cta-pill"><Star size={13} /> تجربة مجانية 14 يومًا</span>
              <h2>لديك مكتب عقاري؟ اعرض عقاراتك على فايند</h2>
              <p>سجّل مكتبك وابدأ تجربة مجانية لمدة 14 يومًا، احصل على صفحة هبوط احترافية برابط خاص، وابدأ باستقبال العملاء مباشرة.</p>
              <Link href="/register" className="fh-cta-btn">ابدأ تجربتك المجانية <ArrowLeft size={16} /></Link>
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
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111827", fontFamily: "'Cairo', sans-serif" }}>
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
              {filteredSheetItems.map(item => {
                const isSel = sheetSelectedValues.includes(item.value);
                return (
                  <button key={item.value} className={`fh-sheet-item${isSel ? " sel" : ""}`} onClick={() => handleSheetSelect(item.value)}>
                    <span>{item.label}</span>
                    {isSel && <Check size={16} color="#667EEA" />}
                  </button>
                );
              })}
              {filteredSheetItems.length === 0 && <p style={{ textAlign: "center", color: "#94A3B8", padding: "32px 20px", fontFamily: "'Cairo', sans-serif", fontSize: 14 }}>لا توجد نتائج</p>}
            </div>
            {/* Single-select cascade: a tap selects and advances, no "تم" needed. */}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
