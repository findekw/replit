// Relative "how long ago a listing was posted" label for the public property
// card — English digits only, granularity minute → hour → day, capped at
// 30 days; anything older falls back to the actual date. Matches the search
// card style (a clock icon + this short label).
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days <= 30) return `${days} يوم`;
  return new Date(iso).toLocaleDateString("ar-KW-u-nu-latn", { day: "numeric", month: "short", year: "numeric" });
}
