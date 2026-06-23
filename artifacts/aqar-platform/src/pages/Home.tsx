import MainLayout from "@/components/layout/MainLayout";
import { useLocation } from "wouter";
import React, { useState, useRef } from "react";
import { ChevronDown, X, Check, Search, ArrowLeft, Building2, MapPin, MessageCircle } from "lucide-react";
import { LocationCombobox } from "@/components/LocationCombobox";

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

const FEATURES: { icon: React.ReactNode; label: string; desc: string; iconColor: string; iconBg: string }[] = [
  {
    icon: <Building2 size={28} strokeWidth={2} />,
    label: "إعلانات من مكاتب مباشرة",
    desc: "جميع الإعلانات من مكاتب عقارية موثوقة ومرخصة",
    iconColor: "#3F5BD8",
    iconBg:   "#EEF2FF",
  },
  {
    icon: <Search size={28} strokeWidth={2} />,
    label: "ابحث بسهولة خلال ثواني",
    desc: "فلتر حسب النوع والمنطقة والميزانية بخطوة واحدة",
    iconColor: "#059669",
    iconBg:   "#ECFDF5",
  },
  {
    icon: <MessageCircle size={28} strokeWidth={2} />,
    label: "تواصل مباشر بدون وسيط",
    desc: "تواصل مع المعلن مباشرة عبر واتساب بدون تعقيد",
    iconColor: "#D97706",
    iconBg:   "#FEF3C7",
  },
  {
    icon: <MapPin size={28} strokeWidth={2} />,
    label: "كل مناطق الكويت في مكان واحد",
    desc: "تصفح جميع المحافظات والمناطق بسهولة",
    iconColor: "#DC2626",
    iconBg:   "#FFF1F2",
  },
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
        /* ── Design tokens ── */
        :root {
          --primary-gradient:  linear-gradient(180deg, #1F2A44 0%, #3F5BD8 100%);
          --primary-solid:     #3F5BD8;
          --clr-primary:       #3F5BD8;
          --clr-primary-light: #2C4BB0;
          --clr-bg:            #F5F7FA;
          --clr-surface:       #FFFFFF;
          --clr-border:        #E5E7EB;
          --clr-text-main:     #1F2A44;
          --clr-text-muted:    #0f172a;
          --sp-section:        40px;
          --sp-elem:           16px;
          --radius-card:       14px;
          --radius-btn:        12px;
        }
        body { background: #F5F7FA !important; }

        /* ═══════════════════════════════
           HERO
        ═══════════════════════════════ */
        .fh-hero {
          background: #F5F7FA;
          padding: var(--sp-section) 16px 36px;
          text-align: center;
        }
        .fh-container {
          max-width: 540px;
          margin: 0 auto;
        }
        .fh-headline {
          font-size: 26px;
          font-weight: 800;
          color: var(--clr-text-main);
          margin: 0 0 8px;
          line-height: 1.45;
          letter-spacing: -0.3px;
          font-family: 'Cairo', sans-serif;
        }
        .fh-subtitle {
          font-size: 14px;
          color: var(--clr-text-muted);
          margin: 0 0 28px;
          line-height: 1.7;
          font-family: 'Cairo', sans-serif;
        }

        /* ═══════════════════════════════
           SEARCH CARD
        ═══════════════════════════════ */
        .fh-card {
          background: #FFFFFF;
          border-radius: 18px;
          padding: 20px 18px 18px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          border: 1px solid #E5E7EB;
          text-align: right;
        }

        /* Tabs */
        .fh-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: var(--sp-elem);
          direction: rtl;
        }
        .fh-tab {
          flex: 1;
          padding: 9px 6px;
          border-radius: var(--radius-btn);
          border: 1.5px solid #94A3B8;
          background: #F5F7FA;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
          font-family: 'Cairo', sans-serif;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }
        .fh-tab:hover { border-color: var(--clr-primary); color: var(--clr-primary); }
        .fh-tab.active {
          background: #3F5BD8;
          color: #fff;
          border-color: transparent;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(63,91,216,0.22);
        }

        /* Mobile field buttons */
        .fh-mob-fields {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 14px;
          direction: rtl;
        }
        .fh-mob-btn {
          width: 100%;
          height: 50px;
          border: 1.5px solid #94A3B8;
          border-radius: var(--radius-btn);
          background: #F5F7FA;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 14px;
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          text-align: right;
          transition: border-color 0.15s, background 0.15s;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }
        .fh-mob-btn.filled {
          border-color: var(--clr-primary);
          color: var(--clr-text-main);
          background: #EEF4FF;
        }
        .fh-mob-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Desktop combobox fields */
        .fh-desk-fields {
          display: none;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 14px;
          direction: rtl;
        }

        /* Search button */
        .fh-search-btn {
          width: 100%;
          height: 52px;
          border: none;
          border-radius: var(--radius-btn);
          background: #3F5BD8;
          color: #fff;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          letter-spacing: 0.3px;
          box-shadow: 0 3px 12px rgba(63,91,216,0.28);
          transition: opacity 0.15s;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }
        .fh-search-btn:hover  { opacity: 0.88; }
        .fh-search-btn:active { opacity: 0.80; }

        /* ═══════════════════════════════
           FEATURES SECTION
        ═══════════════════════════════ */
        .fh-features-section {
          background: #F5F7FA;
          padding: var(--sp-section) 20px;
          border-top: 1px solid var(--clr-border);
          border-bottom: 1px solid var(--clr-border);
        }
        .fh-features-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--clr-text-main);
          margin: 0 0 24px;
          text-align: center;
          font-family: 'Cairo', sans-serif;
          line-height: 1.6;
        }
        .fh-features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          max-width: 960px;
          margin: 0 auto;
        }
        .fh-feat-card {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          cursor: default;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .fh-feat-icon {
          width: 56px;
          height: 56px;
          background: var(--background-section);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--icon-color);
          flex-shrink: 0;
        }
        .fh-feat-label {
          font-size: 17px;
          font-weight: 700;
          color: var(--text-heading);
          font-family: 'Cairo', sans-serif;
          line-height: 1.4;
          margin: 12px 0 0;
          text-align: center;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fh-feat-desc {
          font-size: 15px;
          font-weight: 400;
          color: #0f172a;
          font-family: 'Cairo', sans-serif;
          text-align: center;
          line-height: 1.6;
          margin: 6px 0 0;
        }

        @media (max-width: 600px) {
          .fh-features-grid {
            grid-template-columns: 1fr;
            gap: 10px;
            max-width: 100%;
          }
          .fh-feat-card {
            padding: 14px;
          }
          .fh-feat-icon {
            width: 44px;
            height: 44px;
            border-radius: 10px;
          }
          .fh-feat-icon svg {
            width: 24px;
            height: 24px;
          }
          .fh-feat-label {
            font-size: 15px;
            margin-top: 10px;
          }
          .fh-feat-desc {
            font-size: 14px;
            color: #0f172a;
            line-height: 1.5;
            margin-top: 4px;
          }
        }

        /* ═══════════════════════════════
           CTA SECTION
        ═══════════════════════════════ */
        .fh-cta-section {
          margin: 40px 16px 24px;
          background: transparent;
          direction: rtl;
        }
        .fh-cta-box {
          background: #F5F7FA;
          border-radius: 20px;
          padding: 28px 20px;
          text-align: center;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          border: 1px solid #E5E7EB;
          max-width: 100%;
        }
        .fh-cta-title {
          font-size: 22px;
          font-weight: 700;
          color: #1F2A44;
          margin: 0 0 10px;
          line-height: 1.4;
          font-family: 'Cairo', sans-serif;
        }
        .fh-cta-desc {
          font-size: 14px;
          color: #0f172a;
          margin: 0 0 20px;
          line-height: 1.75;
          font-family: 'Cairo', sans-serif;
        }
        .fh-cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 999px;
          border: none;
          background: #3F5BD8;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          transition: all 0.25s ease;
          outline: none;
          text-decoration: none;
          -webkit-tap-highlight-color: transparent;
        }
        .fh-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }
        .fh-cta-btn:active { transform: scale(0.97); }

        /* ═══════════════════════════════
           SHEET PANEL (bottom on mobile, centered dialog on desktop)
        ═══════════════════════════════ */
        .fh-sheet-wrapper {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; flex-direction: column; justify-content: flex-end;
        }
        .fh-sheet-panel {
          position: relative; background: #fff;
          border-radius: 22px 22px 0 0; height: 80vh;
          display: flex; flex-direction: column;
          box-shadow: 0 -8px 40px rgba(0,0,0,0.16);
        }
        @media (min-width: 769px) {
          .fh-sheet-wrapper {
            justify-content: center; align-items: center;
          }
          .fh-sheet-panel {
            border-radius: 20px; height: auto; max-height: 70vh;
            width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,0.20);
          }
          .fh-sheet-handle { display: none; }
        }

        /* ═══════════════════════════════
           SHEET ITEMS
        ═══════════════════════════════ */
        .fh-sheet-item {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border: none; border-bottom: 1px solid var(--clr-bg);
          cursor: pointer; font-size: 15px; font-weight: 400; color: #1E293B;
          background: transparent; text-align: right; outline: none;
          -webkit-tap-highlight-color: transparent;
          font-family: 'Cairo', sans-serif;
        }
        .fh-sheet-item:active { background: #F1F5F9; }
        .fh-sheet-item.sel { background: #EEF4FF; color: var(--clr-primary); font-weight: 600; }

        /* ═══════════════════════════════
           RESPONSIVE
        ═══════════════════════════════ */
        @media (min-width: 769px) {
          .fh-hero      { padding: 56px 24px 48px; }
          .fh-headline  { font-size: 32px; }
          .fh-subtitle  { font-size: 15px; margin-bottom: 32px; }
          .fh-card      { padding: 28px 26px 24px; }
          .fh-features-section { padding: var(--sp-section) 24px; }
          .fh-features-title   { font-size: 18px; margin-bottom: 28px; }
          .fh-features-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            max-width: 960px;
          }
          .fh-cta-section { margin: 48px auto 28px; max-width: 700px; }
          .fh-cta-box     { padding: 36px 28px; }
          .fh-cta-title   { font-size: 26px; }
          .fh-cta-desc    { font-size: 15px; }
        }

        @media (min-width: 1024px) {
          .fh-container   { max-width: 580px; }
          .fh-headline    { font-size: 34px; }
          .fh-cta-section { max-width: 900px; }
          .fh-cta-box     { padding: 44px 40px; }
          .fh-cta-title   { font-size: 30px; }
          .fh-cta-desc    { font-size: 16px; }
        }
      `}</style>

      {/* ═══════════════════════════════
          HERO + SEARCH
      ═══════════════════════════════ */}
      <section className="fh-hero" dir="rtl">
        <div className="fh-container">
          <h1 className="fh-headline">ابحث عن عقارك بسهولة</h1>
          <p className="fh-subtitle">كل ما تحتاجه للبحث عن العقار في مكان واحد</p>

          <div className="fh-card">
            {/* Tabs */}
            <div className="fh-tabs">
              {["للإيجار", "للبيع", "للبدل"].map(s => (
                <button
                  key={s}
                  className={`fh-tab${status === s ? " active" : ""}`}
                  onClick={() => handleStatusChange(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Mobile fields */}
            <div className="fh-mob-fields">
              <button className={`fh-mob-btn${type ? " filled" : ""}`} onClick={() => openSheet("type")}>
                <span>{type || "نوع العقار"}</span>
                <ChevronDown size={17} color={type ? "#054A91" : "#94A3B8"} />
              </button>
              <button className={`fh-mob-btn${province ? " filled" : ""}`} onClick={() => openSheet("gov")}>
                <span>{province || "المحافظة"}</span>
                <ChevronDown size={17} color={province ? "#054A91" : "#94A3B8"} />
              </button>
              <button
                className={`fh-mob-btn${area ? " filled" : ""}`}
                onClick={() => { if (province) openSheet("area"); }}
                disabled={!province}
              >
                <span>{area || (province ? "المنطقة" : "اختر المحافظة أولاً")}</span>
                <ChevronDown size={17} color={area ? "#054A91" : "#94A3B8"} />
              </button>
            </div>

            <button className="fh-search-btn" onClick={handleSearch}>
              ابحث الآن
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          FEATURES
      ═══════════════════════════════ */}
      <section className="fh-features-section" dir="rtl">
        <p className="fh-features-title">كل ما تحتاجه للبحث عن العقار في مكان واحد</p>
        <div className="fh-features-grid">
          {FEATURES.map(item => (
            <div key={item.label} className="fh-feat-card">
              <div className="fh-feat-icon" style={{ background: item.iconBg, color: item.iconColor }}>{item.icon}</div>
              <p className="fh-feat-label">{item.label}</p>
              <p className="fh-feat-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════
          CTA
      ═══════════════════════════════ */}
      <section className="fh-cta-section">
        <div className="fh-cta-box">
          <h2 className="fh-cta-title">اعرض عقاراتك في مكان واحد</h2>
          <p className="fh-cta-desc">شارك جميع عقاراتك برابط واحد بسهولة</p>
          <a href="/plans" className="fh-cta-btn">
            ابدأ التجربة المجانية
            <ArrowLeft size={16} />
          </a>
        </div>
      </section>

      {/* ═══════════════════════════════
          MOBILE BOTTOM SHEET
      ═══════════════════════════════ */}
      {sheetOpen && (
        <div className="fh-sheet-wrapper">
          <div onClick={closeSheet} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.50)" }} />
          <div dir="rtl" className="fh-sheet-panel">
            <div className="fh-sheet-handle" style={{ width: 40, height: 4, background: "#E2E8F0", borderRadius: 2, margin: "14px auto 0", flexShrink: 0 }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 10px", borderBottom: "1px solid #F1F5F9", flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#07223D", fontFamily: "'Cairo', sans-serif" }}>
                {sheetOpen === "type" ? "نوع العقار" : sheetOpen === "gov" ? "المحافظة" : "المنطقة"}
              </h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {!sheetSearchVisible && (
                  <button onClick={showSheetSearch} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#F1F5F9", cursor: "pointer", outline: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Search size={15} color="#64748B" />
                  </button>
                )}
                <button onClick={closeSheet} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#F1F5F9", cursor: "pointer", outline: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={16} color="#64748B" />
                </button>
              </div>
            </div>
            {sheetSearchVisible && (
              <div style={{ padding: "10px 16px 6px", flexShrink: 0, borderBottom: "1px solid #F1F5F9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F1F5F9", borderRadius: 12, padding: "0 12px" }}>
                  <Search size={15} color="#94A3B8" style={{ flexShrink: 0 }} />
                  <input
                    ref={sheetInputRef}
                    type="text" inputMode="search"
                    value={sheetQuery} onChange={e => setSheetQuery(e.target.value)}
                    placeholder="ابحث..." dir="rtl" lang="ar"
                    autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                    style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 15, padding: "10px 0", fontFamily: "'Cairo', sans-serif", color: "#0F172A" }}
                  />
                  {sheetQuery && (
                    <button onClick={() => setSheetQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}>
                      <X size={14} color="#94A3B8" />
                    </button>
                  )}
                </div>
              </div>
            )}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {filteredSheetItems.map(item => (
                <button
                  key={item.value}
                  className={`fh-sheet-item${item.value === currentSheetValue ? " sel" : ""}`}
                  onClick={() => handleSheetSelect(item.value)}
                >
                  <span>{item.label}</span>
                  {item.value === currentSheetValue && <Check size={16} color="#1E3A8A" />}
                </button>
              ))}
              {filteredSheetItems.length === 0 && (
                <p style={{ textAlign: "center", color: "#94A3B8", padding: "32px 20px", fontFamily: "'Cairo', sans-serif", fontSize: 14 }}>
                  لا توجد نتائج
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
