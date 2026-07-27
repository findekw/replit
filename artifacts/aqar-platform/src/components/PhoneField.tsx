// Shared Kuwait phone input: 🇰🇼 flag + "+965" prefix, then exactly 8 digits.
// Stores the bare 8-digit local number (no country code) — toIntlPhone()
// prepends 965 when building wa.me/tel links. Use this everywhere a phone is
// entered so every form on the site looks identical to the office registration
// field. Extracted from Register.tsx's inline field.

const DIAL_CODE = "965";
const MAX_DIGITS = 8;

const KuwaitFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 900 600"
    style={{ width: 22, height: 15, display: "block", borderRadius: 2, flexShrink: 0 }}
    aria-label="علم الكويت"
  >
    <rect width="900" height="200" fill="#007a3d" />
    <rect y="200" width="900" height="200" fill="#ffffff" />
    <rect y="400" width="900" height="200" fill="#ce1126" />
    <polygon points="0,0 225,200 225,400 0,600" fill="#000000" />
  </svg>
);

export interface PhoneFieldProps {
  /** Bare local digits (max 8, no country code). */
  value: string;
  /** Receives the sanitized digits (already stripped + capped at 8). */
  onChange: (digits: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  "data-testid"?: string;
}

export default function PhoneField({
  value, onChange, placeholder = "12345678", disabled, invalid, id, ...rest
}: PhoneFieldProps) {
  return (
    <div
      style={{
        display: "flex",
        direction: "ltr",
        border: invalid ? "1px solid #f87171" : "1px solid hsl(var(--input))",
        borderRadius: 8,
        overflow: "hidden",
        background: "hsl(var(--background))",
      }}
    >
      <div
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: "0 12px",
          background: "hsl(var(--muted))", borderRight: "1px solid hsl(var(--input))",
          whiteSpace: "nowrap", fontSize: 13, fontWeight: 600,
          color: "hsl(var(--muted-foreground))", userSelect: "none", flexShrink: 0,
        }}
      >
        <KuwaitFlag />
        <span>+{DIAL_CODE}</span>
      </div>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        placeholder={placeholder}
        maxLength={MAX_DIGITS}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, MAX_DIGITS))}
        style={{
          flex: 1, padding: "9px 12px", fontSize: 14, background: "transparent",
          outline: "none", color: "hsl(var(--foreground))", direction: "ltr",
          minWidth: 0, fontFamily: "'Cairo', sans-serif",
        }}
        {...rest}
      />
    </div>
  );
}
