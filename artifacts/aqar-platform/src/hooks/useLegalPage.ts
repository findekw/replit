import { useEffect, useState } from "react";
import { getApiBase } from "@/lib/apiBase";

const BASE = getApiBase();

export type LegalSection = { title: string; content: string };
export type LegalContent = { titleAr: string; intro: string; sections: LegalSection[] };

/**
 * Legal pages are admin-edited (لوحة الإدارة → الأدوات → تحرير السياسات); the
 * hardcoded content passed in is only the fallback if the API is unreachable
 * or the page was never saved.
 */
export function useLegalPage(slug: "terms" | "privacy" | "disclaimer", fallback: LegalContent): LegalContent {
  const [content, setContent] = useState<LegalContent>(fallback);

  useEffect(() => {
    let alive = true;
    fetch(`${BASE}/api/legal/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { titleAr?: string; intro?: string; sections?: LegalSection[] }) => {
        if (!alive || !d.sections?.length) return;
        setContent({ titleAr: d.titleAr ?? fallback.titleAr, intro: d.intro ?? "", sections: d.sections });
      })
      .catch(() => { /* keep fallback */ });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return content;
}
