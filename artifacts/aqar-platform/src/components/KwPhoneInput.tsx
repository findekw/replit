/**
 * Kuwait phone input — a fixed "+965" prefix box next to an 8-digit numeric
 * field. Value is the bare 8-digit local number (matching how offices/listings
 * store numbers); toIntlPhone adds the country code when building links.
 */

/** Kuwait mobile: 8 digits starting with 9, 6, 5 or 4. */
export const KW_PHONE_RE = /^[9654]\d{7}$/;

/** Strip any country code / formatting down to the 8-digit local number. */
export function toLocal8(raw?: string | null): string {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("965") && d.length > 8) d = d.slice(3);
  return d.slice(0, 8);
}

export function KwPhoneInput({
  id,
  value,
  onChange,
  disabled,
  placeholder = "99887766",
  invalid,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <div
      dir="ltr"
      className="mt-1"
      style={{
        display: "flex",
        alignItems: "stretch",
        border: invalid ? "1px solid #f87171" : "1px solid hsl(var(--input))",
        borderRadius: 8,
        overflow: "hidden",
        background: disabled ? "hsl(var(--muted))" : "transparent",
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          fontSize: 14,
          fontWeight: 700,
          color: "#475569",
          background: "#f1f5f9",
          borderInlineEnd: "1px solid hsl(var(--input))",
          flexShrink: 0,
        }}
      >
        +965
      </span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          outline: "none",
          padding: "10px 12px",
          fontSize: 14,
          background: "transparent",
          textAlign: "left",
          direction: "ltr",
          letterSpacing: "0.03em",
        }}
      />
    </div>
  );
}
