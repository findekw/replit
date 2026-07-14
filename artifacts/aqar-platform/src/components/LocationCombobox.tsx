import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Item {
  value: string;
  label: string;
}

interface LocationComboboxProps {
  items: Item[];
  value: string | string[];
  onChange: (value: any) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  showSearch?: boolean;
  listMaxHeight?: string;
  className?: string;
  triggerClassName?: string;
  /** When true, value is a string[] and selecting toggles items (panel stays open). */
  multiple?: boolean;
}

export function LocationCombobox({
  items,
  value,
  onChange,
  placeholder,
  searchPlaceholder = "ابحث...",
  emptyText = "لا توجد نتائج",
  disabled = false,
  showSearch = true,
  listMaxHeight = "280px",
  className,
  triggerClassName,
  multiple = false,
}: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
  const selectedLabels = items.filter((i) => selectedValues.includes(i.value)).map((i) => i.label);
  const selectedLabel = multiple
    ? (selectedLabels.length === 0 ? undefined : selectedLabels.length === 1 ? selectedLabels[0] : `${selectedLabels.length} مختارة`)
    : selectedLabels[0];
  const filtered =
    showSearch && query.trim()
      ? items.filter((item) => item.label.includes(query.trim()))
      : items;

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  function toggle() {
    if (disabled) return;
    setOpen((o) => {
      if (o) setQuery("");
      return !o;
    });
  }

  function select(item: Item) {
    if (multiple) {
      const next = selectedValues.includes(item.value)
        ? selectedValues.filter((v) => v !== item.value)
        : [...selectedValues, item.value];
      onChange(next);
      // keep the panel open so the user can pick several
    } else {
      onChange(item.value === value ? "" : item.value);
      setOpen(false);
      setQuery("");
    }
  }

  const displayText = selectedLabel || placeholder;

  return (
    <div
      dir="rtl"
      ref={containerRef}
      className={cn("relative", className)}
      style={{ zIndex: open ? 9999 : undefined }}
    >
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        style={{
          width: "100%",
          height: "40px",
          paddingRight: "12px",
          paddingLeft: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          borderRadius: "10px",
          border: open ? "1px solid #667EEA" : "1px solid #94A3B8",
          outline: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          background: "transparent",
          transition: "border-color 0.15s ease",
          fontSize: "14px",
          direction: "rtl",
          textAlign: "right",
        }}
        onMouseEnter={(e) => {
          if (!disabled && !open) (e.currentTarget as HTMLButtonElement).style.borderColor = "#64748b";
        }}
        onMouseLeave={(e) => {
          if (!open) (e.currentTarget as HTMLButtonElement).style.borderColor = "#94A3B8";
        }}
        className={triggerClassName}
      >
        <span
          style={{
            flex: 1,
            textAlign: "right",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: selectedLabel ? "#0f172a" : "#64748b",
            fontWeight: 500,
            lineHeight: 1.2,
          }}
        >
          {displayText}
        </span>
        <ChevronDown
          style={{
            width: "16px",
            height: "16px",
            flexShrink: 0,
            color: "#94a3b8",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            width: "100%",
            minWidth: "180px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            overflow: "hidden",
            zIndex: 9999,
            direction: "rtl",
          }}
        >
          {showSearch && (
            <div
              style={{
                padding: "10px 14px 8px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                dir="rtl"
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "13px",
                  textAlign: "right",
                  color: "#1e293b",
                }}
              />
            </div>
          )}
          <div
            style={{
              maxHeight: listMaxHeight === "none" ? undefined : listMaxHeight,
              overflowY: listMaxHeight === "none" ? "visible" : "auto",
              overscrollBehavior: "contain",
            }}
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: "20px 16px",
                  textAlign: "center",
                  fontSize: "13px",
                  color: "#0f172a",
                }}
              >
                {emptyText}
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedValues.includes(item.value);
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => select(item)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "11px 14px",
                      border: "none",
                      outline: "none",
                      cursor: "pointer",
                      textAlign: "right",
                      direction: "rtl",
                      fontSize: "14px",
                      background: isSelected ? "#eff6ff" : "transparent",
                      color: isSelected ? "#1d4ed8" : "#1e293b",
                      fontWeight: isSelected ? 600 : 400,
                      transition: "background 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                  >
                    <Check
                      style={{
                        width: "14px",
                        height: "14px",
                        flexShrink: 0,
                        color: "#667EEA",
                        opacity: isSelected ? 1 : 0,
                      }}
                    />
                    <span style={{ flex: 1, textAlign: "right" }}>{item.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
