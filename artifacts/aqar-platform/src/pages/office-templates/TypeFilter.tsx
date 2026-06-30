import { ChevronDown } from "lucide-react";

/**
 * Compact property-type filter dropdown used across all office landing
 * templates. Native <select> so it stays accessible + light-weight; styled
 * inline so each template can pass its own accent / dark mode.
 */
export function TypeFilter({
  value,
  onChange,
  types,
  dark = false,
  accent = "#667EEA",
}: {
  value: string;
  onChange: (v: string) => void;
  types: readonly string[];
  dark?: boolean;
  accent?: string;
}) {
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="تصفية حسب نوع العقار"
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          fontFamily: "'Cairo', sans-serif",
          fontSize: 14,
          fontWeight: 700,
          color: dark ? "#F4ECD8" : "#111827",
          background: dark ? "rgba(255,255,255,0.05)" : "#fff",
          border: `1px solid ${value ? accent : dark ? "rgba(201,162,39,0.4)" : "#E2E8F0"}`,
          borderRadius: 999,
          padding: "9px 18px 9px 38px",
          cursor: "pointer",
          outline: "none",
          minWidth: 138,
          transition: "border-color .15s",
        }}
      >
        <option value="">كل الأنواع</option>
        {types.map((t) => (
          <option key={t} value={t} style={{ color: "#111827" }}>
            {t}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        style={{ position: "absolute", left: 14, pointerEvents: "none", color: value ? accent : dark ? "#C9A227" : "#94A3B8" }}
      />
    </div>
  );
}

export default TypeFilter;
