import { useState, useEffect, useRef } from "react";
import { useListProperties, useListGovernorates } from "@workspace/api-client-react";
import { getAreasByGovId } from "@/lib/kuwait-areas";
import MainLayout from "@/components/layout/MainLayout";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutGrid, List, SlidersHorizontal, X, ChevronDown, Check, Search } from "lucide-react";
import { LocationCombobox } from "@/components/LocationCombobox";

const PROPERTY_TYPES = [
  "بيت", "شقة", "قسيمة", "ارض", "دور", "محل", "مكتب",
  "مخزن", "مستودع", "شاليه", "استراحة", "مزرعة", "عمارة", "مجمع",
  "قسيمة صناعية", "قسيمة حرفية",
];

const BDAL_TYPES = ["بيت", "قسيمة", "ارض", "شقة", "طلب"];

function parseParams(search: string) {
  const p = new URLSearchParams(search);
  return {
    status: p.get("status") || "",
    type: p.get("type") || "",
    governorateId: p.get("governorateId") || "",
    areaId: p.get("areaId") || "",
    keyword: p.get("keyword") || "",
  };
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#0f172a",
  marginBottom: "10px",
  display: "block",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  height: "40px",
  borderRadius: "10px",
  border: "1.5px solid #94A3B8",
  background: "#F5F7FA",
  padding: "0 10px",
  fontSize: "14px",
  color: "#0f172a",
  outline: "none",
  boxSizing: "border-box",
  textAlign: "right",
};

const STATUS_OPTIONS = ["", "للإيجار", "للبيع", "للبدل"] as const;
const BEDROOM_OPTIONS = ["", "1", "2", "3", "4", "5"] as const;

function StatusChips({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
      {STATUS_OPTIONS.map((s) => {
        const active = value === s;
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            style={{
              height: "38px",
              borderRadius: "10px",
              border: active ? "2px solid #667EEA" : "1.5px solid #94A3B8",
              background: active ? "#667EEA" : "#F5F7FA",
              color: active ? "#ffffff" : "#0f172a",
              fontWeight: active ? 700 : 600,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.15s",
              outline: "none",
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {s || "الكل"}
          </button>
        );
      })}
    </div>
  );
}

function BedroomsChips({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const labels: Record<string, string> = { "": "الكل", "5": "5+" };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}>
      {BEDROOM_OPTIONS.map((b) => {
        const active = value === b;
        return (
          <button
            key={b}
            onClick={() => onChange(b)}
            style={{
              height: "36px",
              borderRadius: "10px",
              border: active ? "2px solid #667EEA" : "1.5px solid #94A3B8",
              background: active ? "#667EEA" : "#F5F7FA",
              color: active ? "#ffffff" : "#0f172a",
              fontWeight: active ? 700 : 600,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.15s",
              outline: "none",
              textAlign: "center",
            }}
          >
            {labels[b] ?? b}
          </button>
        );
      })}
    </div>
  );
}

function RangeInputs({
  minVal, maxVal,
  onMinChange, onMaxChange,
  minPlaceholder, maxPlaceholder,
  unit,
}: {
  minVal: string; maxVal: string;
  onMinChange: (v: string) => void; onMaxChange: (v: string) => void;
  minPlaceholder: string; maxPlaceholder: string;
  unit: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ position: "relative" }}>
        <input
          type="number"
          value={minVal}
          onChange={e => onMinChange(e.target.value)}
          placeholder={minPlaceholder}
          style={INPUT_STYLE}
          min={0}
        />
        <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: "#94a3b8", pointerEvents: "none" }}>
          {unit}
        </span>
      </div>
      <div style={{ position: "relative" }}>
        <input
          type="number"
          value={maxVal}
          onChange={e => onMaxChange(e.target.value)}
          placeholder={maxPlaceholder}
          style={INPUT_STYLE}
          min={0}
        />
        <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: "#94a3b8", pointerEvents: "none" }}>
          {unit}
        </span>
      </div>
    </div>
  );
}

export default function Properties() {
  const initial = parseParams(typeof window !== "undefined" ? window.location.search : "");

  const [status, setStatus] = useState(initial.status);
  const [type, setType] = useState(initial.type);
  const [govId, setGovId] = useState(initial.governorateId);
  const [areaId, setAreaId] = useState(initial.areaId);
  const [keyword] = useState(initial.keyword);
  const [furnished] = useState("");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [tempStatus, setTempStatus] = useState("");
  const [tempType, setTempType] = useState("");
  const [tempGovId, setTempGovId] = useState("");
  const [tempAreaId, setTempAreaId] = useState("");
  const [tempMinPrice, setTempMinPrice] = useState("");
  const [tempMaxPrice, setTempMaxPrice] = useState("");
  const [tempMinArea, setTempMinArea] = useState("");
  const [tempMaxArea, setTempMaxArea] = useState("");
  const [tempBedrooms, setTempBedrooms] = useState("");

  /* ─── Single-field bottom sheet (same pattern as homepage) ─── */
  const [sheetOpen, setSheetOpen] = useState<"type" | "gov" | "area" | null>(null);
  const [sheetQuery, setSheetQuery] = useState("");
  const [sheetSearchVisible, setSheetSearchVisible] = useState(false);
  const sheetInputRef = useRef<HTMLInputElement>(null);

  const params: Record<string, string | number | undefined> = {
    page,
    limit: 15,
    sort: sort === "newest" ? undefined : sort,
  };
  if (status) params.status = status;
  if (type) params.type = type;
  if (govId) params.governorateId = parseInt(govId);
  if (areaId) params.areaId = parseInt(areaId);
  if (keyword) params.keyword = keyword;
  if (furnished) params.furnished = furnished;
  if (minPrice) params.minPrice = parseInt(minPrice);
  if (maxPrice) params.maxPrice = parseInt(maxPrice);
  if (minArea) params.minArea = parseInt(minArea);
  if (maxArea) params.maxArea = parseInt(maxArea);
  if (bedrooms) params.bedrooms = parseInt(bedrooms);

  const { data, isLoading, isFetching } = useListProperties(params as Record<string, string>);
  const { data: governorates } = useListGovernorates();
  const areas = govId ? getAreasByGovId(parseInt(govId)) : [];
  const mobileAreas = tempGovId ? getAreasByGovId(parseInt(tempGovId)) : [];

  /* ─── Sheet computed values ─── */
  const sheetTypeItems = [
    { value: "", label: "جميع الأنواع" },
    ...(status === "للبدل" ? BDAL_TYPES : PROPERTY_TYPES).map(t => ({ value: t, label: t })),
  ];
  const sheetGovItems = [
    { value: "", label: "كل المحافظات" },
    ...(governorates ?? []).map(g => ({ value: String(g.id), label: g.nameAr.replace("محافظة ", "") })),
  ];
  const sheetAreaItems = [
    { value: "", label: "كل المناطق" },
    ...(areas ?? []).map(a => ({ value: String(a.id), label: a.nameAr })),
  ];
  const sheetItems =
    sheetOpen === "type" ? sheetTypeItems :
    sheetOpen === "gov"  ? sheetGovItems :
    sheetOpen === "area" ? sheetAreaItems : [];
  const filteredSheetItems = sheetQuery.trim()
    ? sheetItems.filter(i => i.label.includes(sheetQuery.trim()))
    : sheetItems;
  const currentSheetValue =
    sheetOpen === "type" ? type :
    sheetOpen === "gov"  ? govId :
    sheetOpen === "area" ? areaId : "";

  function openSheet(which: "type" | "gov" | "area") {
    setSheetQuery("");
    setSheetSearchVisible(false);
    setSheetOpen(which);
    // iOS-safe scroll lock
    const y = window.scrollY;
    document.body.dataset.sheetScrollY = String(y);
    document.body.style.position = "fixed";
    document.body.style.top = `-${y}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
  }

  function closeSheet() {
    // Restore scroll before unlocking
    const y = parseInt(document.body.dataset.sheetScrollY ?? "0");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
    window.scrollTo(0, y);
    setSheetOpen(null);
    setSheetQuery("");
    setSheetSearchVisible(false);
  }

  function showSheetSearch() {
    setSheetSearchVisible(true);
    setTimeout(() => sheetInputRef.current?.focus(), 60);
  }

  function handleSheetSelect(value: string) {
    if (sheetOpen === "type") {
      setType(value);
      setPage(1);
      closeSheet();
      if (value) setTimeout(() => openSheet("gov"), 220);
    } else if (sheetOpen === "gov") {
      setGovId(value);
      setAreaId("");
      setPage(1);
      closeSheet();
      if (value) setTimeout(() => openSheet("area"), 220);
    } else if (sheetOpen === "area") {
      setAreaId(value);
      setPage(1);
      closeSheet();
    }
  }

  const properties = data?.properties ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  useEffect(() => {
    if (properties.length > 0) {
      localStorage.setItem("aqar_search_ids", JSON.stringify(properties.map((p) => p.id)));
    }
  }, [properties]);

  // iOS-safe scroll lock for the advanced-filters sheet (mobileOpen)
  // The type/gov/area sheets manage their own lock inside openSheet/closeSheet
  useEffect(() => {
    if (mobileOpen) {
      const y = window.scrollY;
      document.body.dataset.mobileScrollY = String(y);
      document.body.style.position = "fixed";
      document.body.style.top = `-${y}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      const y = parseInt(document.body.dataset.mobileScrollY ?? "0");
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (y) window.scrollTo(0, y);
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function applyFilters() { setPage(1); }

  function openMobileFilter() {
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setTempMinArea(minArea);
    setTempMaxArea(maxArea);
    setTempBedrooms(bedrooms);
    setMobileOpen(true);
  }

  function applyMobileFilter() {
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setMinArea(tempMinArea);
    setMaxArea(tempMaxArea);
    setBedrooms(tempBedrooms);
    setPage(1);
    setMobileOpen(false);
  }

  function resetMobileFilter() {
    setTempMinPrice("");
    setTempMaxPrice("");
    setTempMinArea("");
    setTempMaxArea("");
    setTempBedrooms("");
  }

  const govLabel = (govorates: typeof governorates, id: string) =>
    govId ? (govorates ?? []).find((g) => String(g.id) === id)?.nameAr.replace("محافظة ", "") : null;

  const areaLabel = (areasData: typeof areas, id: string) =>
    areaId ? (areasData ?? []).find((a) => String(a.id) === id)?.nameAr : null;

  const priceChipLabel = () => {
    if (minPrice && maxPrice) return `${parseInt(minPrice).toLocaleString("en-US")} - ${parseInt(maxPrice).toLocaleString("en-US")} د.ك`;
    if (minPrice) return `من ${parseInt(minPrice).toLocaleString("en-US")} د.ك`;
    if (maxPrice) return `حتى ${parseInt(maxPrice).toLocaleString("en-US")} د.ك`;
    return null;
  };

  const areaChipLabel = () => {
    if (minArea && maxArea) return `${minArea} - ${maxArea} م²`;
    if (minArea) return `من ${minArea} م²`;
    if (maxArea) return `حتى ${maxArea} م²`;
    return null;
  };

  const activeChips = [
    status ? { key: "status", label: status, clear: () => { setStatus(""); applyFilters(); } } : null,
    type ? { key: "type", label: type, clear: () => { setType(""); applyFilters(); } } : null,
    govId ? { key: "gov", label: govLabel(governorates, govId), clear: () => { setGovId(""); setAreaId(""); applyFilters(); } } : null,
    areaId ? { key: "area", label: areaLabel(areas, areaId), clear: () => { setAreaId(""); applyFilters(); } } : null,
    (minPrice || maxPrice) ? { key: "price", label: priceChipLabel(), clear: () => { setMinPrice(""); setMaxPrice(""); applyFilters(); } } : null,
    (minArea || maxArea) ? { key: "areaSize", label: areaChipLabel(), clear: () => { setMinArea(""); setMaxArea(""); applyFilters(); } } : null,
    bedrooms ? { key: "bedrooms", label: `${bedrooms === "5" ? "5+" : bedrooms} غرف`, clear: () => { setBedrooms(""); applyFilters(); } } : null,
  ].filter(Boolean) as { key: string; label: string | null | undefined; clear: () => void }[];

  const govItems = [
    { value: "", label: "كل المحافظات" },
    ...(governorates ?? []).map((g) => ({
      value: String(g.id),
      label: g.nameAr.replace("محافظة ", ""),
    })),
  ];

  const typeItems = [
    { value: "", label: "جميع الأنواع" },
    ...(status === "للبدل" ? BDAL_TYPES : PROPERTY_TYPES).map((t) => ({ value: t, label: t })),
  ];

  const tempTypeItems = [
    { value: "", label: "جميع الأنواع" },
    ...(tempStatus === "للبدل" ? BDAL_TYPES : PROPERTY_TYPES).map((t) => ({ value: t, label: t })),
  ];

  const SidebarFilters = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* حالة العقار */}
      <div>
        <span style={LABEL_STYLE}>حالة العقار</span>
        {isMobile
          ? <StatusChips value={tempStatus} onChange={(v) => {
              if (v === "للبدل" && tempType && !BDAL_TYPES.includes(tempType)) setTempType("");
              setTempStatus(v);
            }} />
          : <StatusChips value={status} onChange={(v) => {
              if (v === "للبدل" && type && !BDAL_TYPES.includes(type)) setType("");
              setStatus(v); applyFilters();
            }} />}
      </div>

      {/* نوع العقار */}
      <div>
        <span style={LABEL_STYLE}>نوع العقار</span>
        {isMobile
          ? <LocationCombobox items={tempTypeItems} value={tempType} onChange={setTempType} placeholder="جميع الأنواع" showSearch={false} listMaxHeight="320px" emptyText="لا يوجد نوع" />
          : <LocationCombobox items={typeItems} value={type} onChange={(v) => { setType(v); applyFilters(); }} placeholder="جميع الأنواع" showSearch={false} listMaxHeight="400px" emptyText="لا يوجد نوع" />}
      </div>

      {/* المحافظة */}
      <div>
        <span style={LABEL_STYLE}>المحافظة</span>
        {isMobile
          ? <LocationCombobox items={govItems} value={tempGovId} onChange={(v) => { setTempGovId(v); setTempAreaId(""); }} placeholder="كل المحافظات" showSearch={false} listMaxHeight="none" emptyText="لا توجد محافظة" />
          : <LocationCombobox items={govItems} value={govId} onChange={(v) => { setGovId(v); setAreaId(""); applyFilters(); }} placeholder="كل المحافظات" showSearch={false} listMaxHeight="none" emptyText="لا توجد محافظة" />}
      </div>

      {/* المنطقة */}
      <div>
        <span style={LABEL_STYLE}>المنطقة</span>
        {isMobile
          ? <LocationCombobox items={(mobileAreas ?? []).map((a) => ({ value: String(a.id), label: a.nameAr }))} value={tempAreaId} onChange={setTempAreaId} placeholder={tempGovId ? "كل المناطق" : "اختر المحافظة أولاً"} searchPlaceholder="ابحث عن منطقة..." emptyText="لا توجد مناطق" disabled={!tempGovId} showSearch listMaxHeight="280px" />
          : <LocationCombobox items={(areas ?? []).map((a) => ({ value: String(a.id), label: a.nameAr }))} value={areaId} onChange={(v) => { setAreaId(v); applyFilters(); }} placeholder={govId ? "كل المناطق" : "اختر المحافظة أولاً"} searchPlaceholder="ابحث عن منطقة..." emptyText="لا توجد مناطق" disabled={!govId} showSearch listMaxHeight="280px" />}
      </div>

      {/* عدد الغرف */}
      <div>
        <span style={LABEL_STYLE}>عدد الغرف</span>
        {isMobile
          ? <BedroomsChips value={tempBedrooms} onChange={setTempBedrooms} />
          : <BedroomsChips value={bedrooms} onChange={(v) => { setBedrooms(v); applyFilters(); }} />}
      </div>

      {/* السعر */}
      <div>
        <span style={LABEL_STYLE}>السعر (د.ك)</span>
        <RangeInputs
          minVal={isMobile ? tempMinPrice : minPrice}
          maxVal={isMobile ? tempMaxPrice : maxPrice}
          onMinChange={isMobile ? setTempMinPrice : (v) => { setMinPrice(v); applyFilters(); }}
          onMaxChange={isMobile ? setTempMaxPrice : (v) => { setMaxPrice(v); applyFilters(); }}
          minPlaceholder="الحد الأدنى"
          maxPlaceholder="الحد الأقصى"
          unit="د.ك"
        />
      </div>

      {/* المساحة */}
      <div>
        <span style={LABEL_STYLE}>المساحة (م²)</span>
        <RangeInputs
          minVal={isMobile ? tempMinArea : minArea}
          maxVal={isMobile ? tempMaxArea : maxArea}
          onMinChange={isMobile ? setTempMinArea : (v) => { setMinArea(v); applyFilters(); }}
          onMaxChange={isMobile ? setTempMaxArea : (v) => { setMaxArea(v); applyFilters(); }}
          minPlaceholder="الحد الأدنى"
          maxPlaceholder="الحد الأقصى"
          unit="م²"
        />
      </div>
    </>
  );

  return (
    <MainLayout>
      <div dir="rtl" className="container mx-auto px-4 py-8">

        {/* Header row 1: title + controls */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">العقارات</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px", minHeight: "22px" }}>
              {isFetching && !isLoading ? (
                <span className="results-refreshing-text">
                  <span className="results-spinner" />
                  يتم تحديث النتائج...
                </span>
              ) : (
                <p className="text-muted-foreground" style={{ margin: 0 }}>
                  {total > 0 ? `${total} عقار متاح` : isLoading ? "" : "لا توجد نتائج"}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="hidden md:flex gap-2">
              <Button variant={view === "grid" ? "default" : "outline"} size="icon" style={view !== "grid" ? { background: "#fff" } : {}} onClick={() => setView("grid")}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={view === "list" ? "default" : "outline"} size="icon" style={view !== "list" ? { background: "#fff" } : {}} onClick={() => setView("list")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
            <div className="hidden md:block">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-40" style={{ background: "#fff" }}>
                  <SelectValue placeholder="الترتيب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">الأحدث</SelectItem>
                  <SelectItem value="price_asc">السعر: الأقل</SelectItem>
                  <SelectItem value="price_desc">السعر: الأعلى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ─── Shared sheet styles ─── */}
        <style>{`
          body,
          .main-page,
          .homepage,
          section,
          .main-section {
            background-color: #F5F7FA !important;
          }
          @keyframes propSheetSlideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          @keyframes propBackdropFade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .prop-sheet-panel { animation: propSheetSlideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
          .prop-sheet-backdrop { animation: propBackdropFade 0.2s ease both; }

          /* ── Pagination ── */
          .pagination button,
          .pagination a {
            background-color: #ffffff;
            color: #111827;
            border: 1px solid #E5E7EB;
            border-radius: 10px;
            padding: 8px 16px;
            font-size: 14px;
            transition: all 0.2s ease;
          }
          .pagination button:hover,
          .pagination a:hover {
            background-color: #F5F7FA;
          }
          .pagination .active,
          .pagination button.active,
          .pagination a.active {
            background-color: #667EEA;
            color: #ffffff;
            border-color: #667EEA;
          }
          .pagination button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          @media (max-width: 768px) {
            .pagination button,
            .pagination a {
              padding: 6px 12px;
              font-size: 13px;
            }
          }

          .prop-field-btn {
            width: 100%; height: 52px;
            background: #F5F7FA; border: 1.5px solid #94A3B8; border-radius: 14px;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 16px; cursor: pointer; font-size: 15px; color: #0f172a;
            transition: border-color 0.15s, background 0.15s; outline: none;
          }
          .prop-field-btn:active:not(:disabled) { background: #f1f5f9; }
          .prop-field-btn.has-value { background: #eff6ff; border-color: #667EEA; }
          .prop-field-btn:disabled { opacity: 0.45; cursor: not-allowed; }

          .prop-sheet-item {
            width: 100%; display: flex; align-items: center; justify-content: space-between;
            padding: 16px 20px; border: none; border-bottom: 1px solid #F5F7FA;
            cursor: pointer; font-size: 15px; font-weight: 400; color: #1e293b;
            background: transparent; text-align: right; outline: none;
            -webkit-tap-highlight-color: transparent;
          }
          .prop-sheet-item:active { background: #f1f5f9; }
          .prop-sheet-item.sel { background: #eff6ff; color: #667EEA; font-weight: 600; }

          .prop-status-tab {
            padding: 10px 14px; font-size: 14px; font-weight: 700;
            background: none; border: none; cursor: pointer;
            white-space: nowrap; flex-shrink: 0; outline: none;
            transition: color 0.15s;
          }

          /* ── Loading feedback ── */
          @keyframes resultsBarSlide {
            0%   { left: -40%; }
            100% { left: 140%; }
          }
          .results-loading-track {
            position: relative; height: 3px; background: #e0e7ff;
            border-radius: 2px; overflow: hidden; margin-bottom: 14px;
          }
          .results-loading-thumb {
            position: absolute; top: 0; bottom: 0; width: 40%;
            background: linear-gradient(90deg, #667EEA, #7B9FF5);
            border-radius: 2px;
            animation: resultsBarSlide 1.1s ease-in-out infinite;
          }
          @keyframes refreshPulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          .results-refreshing-text {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: 13px; color: #667EEA; font-weight: 600;
            animation: refreshPulse 1.2s ease infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          .results-spinner {
            width: 13px; height: 13px; border: 2px solid #c7d2fe;
            border-top-color: #667EEA; border-radius: 50%;
            animation: spin 0.7s linear infinite; flex-shrink: 0;
          }
        `}</style>

        {/* ─── MOBILE SEARCH BAR (hidden on md+) ─── */}
        <div className="md:hidden" style={{ marginBottom: "14px" }}>
          <div style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: "16px", overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}>
            {/* Status tabs */}
            <div dir="rtl" style={{
              display: "flex", borderBottom: "1px solid #f1f5f9",
              padding: "0 12px", overflowX: "auto", scrollbarWidth: "none",
            }}>
              {["", "للإيجار", "للبيع", "للبدل"].map(s => (
                <button
                  key={s}
                  className="prop-status-tab"
                  onClick={() => {
                    if (s === "للبدل" && type && !BDAL_TYPES.includes(type)) setType("");
                    setStatus(s); applyFilters();
                  }}
                  style={{
                    borderBottom: status === s ? "2.5px solid #667EEA" : "2.5px solid transparent",
                    color: status === s ? "#111827" : "#9ca3af",
                    marginBottom: -1,
                  }}
                >
                  {s || "الكل"}
                </button>
              ))}
            </div>

            {/* Field buttons */}
            <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "14px 14px 10px" }}>
              {/* Type */}
              <button
                className={`prop-field-btn${type ? " has-value" : ""}`}
                onClick={() => openSheet("type")}
              >
                <span style={{ color: type ? "#1e293b" : "#94a3b8", fontWeight: type ? 600 : 400 }}>
                  {type || "نوع العقار"}
                </span>
                <ChevronDown size={18} color={type ? "#667EEA" : "#94a3b8"} />
              </button>

              {/* Governorate */}
              <button
                className={`prop-field-btn${govId ? " has-value" : ""}`}
                onClick={() => openSheet("gov")}
              >
                <span style={{ color: govId ? "#1e293b" : "#94a3b8", fontWeight: govId ? 600 : 400 }}>
                  {govId
                    ? (governorates ?? []).find(g => String(g.id) === govId)?.nameAr.replace("محافظة ", "")
                    : "المحافظة"}
                </span>
                <ChevronDown size={18} color={govId ? "#667EEA" : "#94a3b8"} />
              </button>

              {/* Area */}
              <button
                className={`prop-field-btn${areaId ? " has-value" : ""}`}
                onClick={() => { if (govId) openSheet("area"); }}
                disabled={!govId}
              >
                <span style={{ color: areaId ? "#1e293b" : "#94a3b8", fontWeight: areaId ? 600 : 400 }}>
                  {areaId
                    ? (areas ?? []).find(a => String(a.id) === areaId)?.nameAr
                    : govId ? "المنطقة" : "اختر المحافظة أولاً"}
                </span>
                <ChevronDown size={18} color={areaId ? "#667EEA" : "#94a3b8"} />
              </button>

              {/* Advanced filters row */}
              <div style={{ display: "flex", gap: "8px", paddingBottom: "4px" }}>
                <button
                  onClick={openMobileFilter}
                  style={{
                    flex: 1, height: "44px", borderRadius: "12px",
                    border: "1.5px solid #e2e8f0", background: "#F5F7FA",
                    color: "#475569", fontWeight: 600, fontSize: "14px",
                    cursor: "pointer", outline: "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  }}
                >
                  <SlidersHorizontal size={15} />
                  فلاتر أخرى
                  {(minPrice || maxPrice || minArea || maxArea || bedrooms) && (
                    <span style={{
                      minWidth: "18px", height: "18px", borderRadius: "9px",
                      background: "#667EEA", color: "#fff",
                      fontSize: "11px", fontWeight: 700,
                      display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
                    }}>
                      {[minPrice || maxPrice, minArea || maxArea, bedrooms].filter(Boolean).length}
                    </span>
                  )}
                </button>
                <div style={{ flexShrink: 0 }}>
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="w-32" style={{ height: "44px" }}>
                      <SelectValue placeholder="الترتيب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">الأحدث</SelectItem>
                      <SelectItem value="price_asc">السعر: الأقل</SelectItem>
                      <SelectItem value="price_desc">السعر: الأعلى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                onClick={chip.clear}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "5px 12px", borderRadius: "20px",
                  border: "1.5px solid #bfdbfe", background: "#eff6ff",
                  color: "#1d4ed8", fontWeight: 600, fontSize: "13px",
                  cursor: "pointer", outline: "none",
                }}
              >
                {chip.label}
                <X size={12} strokeWidth={2.5} />
              </button>
            ))}
            {activeChips.length > 1 && (
              <button
                onClick={() => {
                  setStatus(""); setType(""); setGovId(""); setAreaId("");
                  setMinPrice(""); setMaxPrice(""); setMinArea(""); setMaxArea(""); setBedrooms("");
                  applyFilters();
                }}
                style={{
                  padding: "5px 12px", borderRadius: "20px",
                  border: "1.5px solid #fca5a5", background: "#fef2f2",
                  color: "#dc2626", fontWeight: 600, fontSize: "13px",
                  cursor: "pointer", outline: "none",
                }}
              >
                مسح الكل
              </button>
            )}
          </div>
        )}

        <div className="flex gap-6">

          {/* Desktop Sidebar */}
          <aside className="w-72 flex-shrink-0 hidden md:block" dir="rtl">
            <div
              style={{
                position: "sticky",
                top: "100px",
                maxHeight: "80vh",
                overflowY: "auto",
                background: "#ffffff",
                border: "1.5px solid #94A3B8",
                borderRadius: "18px",
                padding: "22px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "22px",
              }}
            >
              <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
                <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", margin: 0 }}>
                  تصفية النتائج
                </h2>
              </div>
              <SidebarFilters isMobile={false} />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">

            {/* Slim loading bar — appears on every fetch (initial + re-fetch) */}
            {isFetching && (
              <div className="results-loading-track">
                <div className="results-loading-thumb" />
              </div>
            )}

            {isLoading ? (
              /* Initial skeleton grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-xl" />
                ))}
              </div>
            ) : properties.length === 0 ? (
              /* Empty state */
              <div style={{ textAlign: "center", padding: "64px 20px" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "#f1f5f9", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px", fontSize: 28,
                }}>
                  🔍
                </div>
                <p style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
                  لا يوجد عقارات حالياً
                </p>
                <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: 1.6 }}>
                  جرّب تغيير معايير البحث أو إزالة بعض الفلاتر
                </p>
              </div>
            ) : (
              /* Cards — dimmed while re-fetching */
              <div style={{ transition: "opacity 0.2s ease", opacity: isFetching ? 0.55 : 1 }}>
                <div
                  className={
                    view === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                      : "flex flex-col gap-4"
                  }
                >
                  {properties.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-10">
                    <Button variant="outline" style={{ background: "#fff" }} disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      السابق
                    </Button>
                    <span className="px-4 py-2 text-sm text-muted-foreground">
                      {page} / {totalPages}
                    </span>
                    <Button variant="outline" style={{ background: "#fff" }} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      التالي
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Single-field bottom sheet (type / gov / area) ─── */}
      {sheetOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex", flexDirection: "column", justifyContent: "flex-end",
          }}
        >
          <div
            className="prop-sheet-backdrop"
            onClick={closeSheet}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.52)" }}
          />
          <div
            className="prop-sheet-panel"
            dir="rtl"
            style={{
              position: "relative",
              background: "#fff",
              borderRadius: "22px 22px 0 0",
              height: "80vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
            }}
          >
            {/* Handle */}
            <div style={{ width: 40, height: 4, background: "#e2e8f0", borderRadius: 2, margin: "14px auto 0", flexShrink: 0 }} />

            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 20px 10px", borderBottom: "1px solid #f1f5f9", flexShrink: 0,
            }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>
                {sheetOpen === "type" ? "نوع العقار" : sheetOpen === "gov" ? "المحافظة" : "المنطقة"}
              </h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {!sheetSearchVisible && (
                  <button
                    onClick={showSheetSearch}
                    style={{
                      width: 32, height: 32, borderRadius: "50%", border: "none",
                      background: "#f1f5f9", cursor: "pointer", outline: "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    aria-label="بحث"
                  >
                    <Search size={15} color="#64748b" />
                  </button>
                )}
                <button
                  onClick={closeSheet}
                  style={{
                    width: 32, height: 32, borderRadius: "50%", border: "none",
                    background: "#f1f5f9", cursor: "pointer", outline: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <X size={16} color="#64748b" />
                </button>
              </div>
            </div>

            {/* Search input — only shown after tapping the search icon */}
            {sheetSearchVisible && (
              <div style={{ padding: "10px 16px 6px", flexShrink: 0, borderBottom: "1px solid #f1f5f9" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#f1f5f9", borderRadius: 12, padding: "0 12px",
                }}>
                  <Search size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
                  <input
                    ref={sheetInputRef}
                    type="text"
                    inputMode="search"
                    value={sheetQuery}
                    onChange={e => setSheetQuery(e.target.value)}
                    placeholder="ابحث..."
                    dir="rtl"
                    lang="ar"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    style={{
                      flex: 1, height: 42, border: "none", outline: "none",
                      background: "transparent", fontSize: 15, textAlign: "right", color: "#1e293b",
                    }}
                  />
                  {sheetQuery && (
                    <button
                      onClick={() => setSheetQuery("")}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
                    >
                      <X size={13} color="#94a3b8" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Scrollable list */}
            <div style={{ overflowY: "auto", flex: 1, paddingBottom: 24, WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
              {filteredSheetItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 20px", color: "#94a3b8", fontSize: 14 }}>
                  لا توجد نتائج
                </div>
              ) : (
                filteredSheetItems.map(item => {
                  const isSel = currentSheetValue === item.value;
                  return (
                    <button
                      key={item.value}
                      className={`prop-sheet-item${isSel ? " sel" : ""}`}
                      onClick={() => handleSheetSelect(item.value)}
                    >
                      <span>{item.label}</span>
                      {isSel && <Check size={16} color="#667EEA" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet — Advanced Filters (bedrooms, price, area size) */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9000,
            display: "flex", flexDirection: "column", justifyContent: "flex-end",
          }}
        >
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }}
          />

          <div
            dir="rtl"
            style={{
              position: "relative",
              background: "#ffffff",
              borderRadius: "22px 22px 0 0",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
            }}
          >
            {/* Sheet header */}
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 20px 14px",
                borderBottom: "1px solid #f1f5f9",
                flexShrink: 0,
              }}
            >
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                تصفية النتائج
              </h2>
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  border: "none", background: "#f1f5f9", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            {/* Sheet content — only extra filters (bedrooms, price, area size) */}
            <div
              style={{
                overflowY: "auto", flex: 1,
                padding: "20px",
                display: "flex", flexDirection: "column", gap: "24px",
              }}
            >
              <div>
                <span style={LABEL_STYLE}>عدد الغرف</span>
                <BedroomsChips value={tempBedrooms} onChange={setTempBedrooms} />
              </div>
              <div>
                <span style={LABEL_STYLE}>السعر (د.ك)</span>
                <RangeInputs
                  minVal={tempMinPrice} maxVal={tempMaxPrice}
                  onMinChange={setTempMinPrice} onMaxChange={setTempMaxPrice}
                  minPlaceholder="الحد الأدنى" maxPlaceholder="الحد الأقصى" unit="د.ك"
                />
              </div>
              <div>
                <span style={LABEL_STYLE}>المساحة (م²)</span>
                <RangeInputs
                  minVal={tempMinArea} maxVal={tempMaxArea}
                  onMinChange={setTempMinArea} onMaxChange={setTempMaxArea}
                  minPlaceholder="الحد الأدنى" maxPlaceholder="الحد الأقصى" unit="م²"
                />
              </div>
            </div>

            {/* Sheet actions */}
            <div
              style={{
                display: "flex", gap: "12px",
                padding: "16px 20px",
                borderTop: "1px solid #f1f5f9",
                flexShrink: 0, background: "#ffffff",
              }}
            >
              <button
                onClick={resetMobileFilter}
                style={{
                  flex: 1, height: "48px", borderRadius: "12px",
                  border: "1.5px solid #e2e8f0", background: "#F5F7FA",
                  color: "#64748b", fontWeight: 600, fontSize: "15px",
                  cursor: "pointer", outline: "none",
                }}
              >
                إعادة تعيين
              </button>
              <button
                onClick={applyMobileFilter}
                style={{
                  flex: 2, height: "48px", borderRadius: "12px",
                  border: "none", background: "#667EEA",
                  color: "#ffffff", fontWeight: 700, fontSize: "15px",
                  cursor: "pointer", outline: "none",
                }}
              >
                عرض النتائج
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
