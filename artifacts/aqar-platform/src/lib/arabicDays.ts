// Correct Arabic pluralization for the noun يوم / أيام after a number.
// Grammar rule (matches how a native speaker reads a day-count):
//   3–10        → "أيام"  (جمع القِلّة)      e.g. 10 أيام · 3 أيام
//   0, 1, 2     → "يوم"                        e.g. 2 يوم · 1 يوم
//   11 and up   → "يوم"   (تمييز مفرد)        e.g. 30 يوم · 15 يوم · 11 يوم
export function daysLabel(n: number): string {
  const d = Math.abs(Math.trunc(n));
  return d >= 3 && d <= 10 ? "أيام" : "يوم";
}

/** "<n> يوم/أيام" with the correct noun form for the count. */
export function daysText(n: number): string {
  return `${n} ${daysLabel(n)}`;
}
