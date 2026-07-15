/**
 * Kuwait mobile numbers are 8 digits and offices often save them without the
 * country code. wa.me and tel: need the full international number, so a bare
 * "69921999" ends up as "+69921999" — an invalid number WhatsApp refuses to
 * open. Normalize before building any link.
 */
export function toIntlPhone(raw: string | null | undefined): string {
  let digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2); // 00965… → 965…
  if (digits.length === 8) digits = `965${digits}`; // local Kuwait number
  return digits;
}

/** Same number, formatted for display: +965 9500 5151 */
export function formatPhone(raw: string | null | undefined): string {
  const d = toIntlPhone(raw);
  if (!d) return "";
  if (d.startsWith("965") && d.length === 11) {
    const local = d.slice(3);
    return `+965 ${local.slice(0, 4)} ${local.slice(4)}`;
  }
  return `+${d}`;
}
