import { Router, type IRouter } from "express";
import {
  db,
  propertiesTable,
  propertyImagesTable,
  officesTable,
  areasTable,
  governoratesTable,
} from "@workspace/db";
import { eq, desc, asc } from "drizzle-orm";

/**
 * Link-preview (Open Graph) pages.
 *
 * The SPA's index.html carries one static set of og: tags, so every shared
 * link — a listing, an office — previewed as the generic site card. Crawlers
 * (WhatsApp, Facebook, Twitter…) don't run JS, so the tags can't be set
 * client-side. Caddy routes crawler user-agents here instead of to the SPA and
 * these routes render the real per-listing/per-office tags. Humans keep getting
 * the SPA untouched.
 */

const router: IRouter = Router();

const SITE = "https://www.finde.co";
const DEFAULT_IMAGE = `${SITE}/opengraph.jpg`;
const DEFAULT_TITLE = "Finde - منصة العقارات";
const DEFAULT_DESC =
  "فايند — ابحث عن عقارك بسهولة. منصة عقارية تجمع عقارات المكاتب الكويتية في مكان واحد.";

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Uploads are stored as site-relative paths; og:image must be absolute. */
function absolute(url: unknown): string {
  const u = String(url ?? "").trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  return `${SITE}${u.startsWith("/") ? "" : "/"}${u}`;
}

/**
 * No og:image:width/height here on purpose. They were hardcoded to 1200x630
 * while the images they described are office logos (~430x427 square) and
 * arbitrary listing photos — WhatsApp lays the card out from those hints and
 * dropped the image when it didn't match, so the preview arrived text-only.
 * Only declare dimensions if they're read from the real file; otherwise let the
 * crawler measure. twitter:card is "summary" for the same reason: these are
 * square logos, not wide banners.
 */
function renderOg(opts: { title: string; description: string; image: string; url: string }): string {
  const { title, description, image, url } = opts;
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Finde" />
<meta property="og:locale" content="ar_KW" />
<meta property="og:url" content="${esc(url)}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${esc(image)}" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(image)}" />
<link rel="canonical" href="${esc(url)}" />
</head>
<body>
<a href="${esc(url)}">${esc(title)}</a>
<script>location.replace(${JSON.stringify(url)});</script>
</body>
</html>`;
}

function sendOg(
  res: import("express").Response,
  opts: { title: string; description: string; image: string; url: string },
): void {
  res.set("Cache-Control", "public, max-age=300");
  res.type("html").send(renderOg(opts));
}

router.get("/og/properties/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const url = `${SITE}/properties/${Number.isFinite(id) ? id : ""}`;
  const fallback = { title: DEFAULT_TITLE, description: DEFAULT_DESC, image: DEFAULT_IMAGE, url };

  if (!Number.isFinite(id) || id <= 0) {
    sendOg(res, fallback);
    return;
  }

  try {
    const [row] = await db
      .select({
        titleAr: propertiesTable.titleAr,
        descriptionAr: propertiesTable.descriptionAr,
        status: propertiesTable.status,
        price: propertiesTable.price,
        officeName: officesTable.nameAr,
        officeLogo: officesTable.logo,
        areaName: areasTable.nameAr,
        govName: governoratesTable.nameAr,
      })
      .from(propertiesTable)
      .leftJoin(officesTable, eq(propertiesTable.officeId, officesTable.id))
      .leftJoin(areasTable, eq(propertiesTable.areaId, areasTable.id))
      .leftJoin(governoratesTable, eq(propertiesTable.governorateId, governoratesTable.id))
      .where(eq(propertiesTable.id, id))
      .limit(1);

    if (!row) {
      sendOg(res, fallback);
      return;
    }

    const [image] = await db
      .select({ url: propertyImagesTable.url })
      .from(propertyImagesTable)
      .where(eq(propertyImagesTable.propertyId, id))
      .orderBy(desc(propertyImagesTable.isPrimary), asc(propertyImagesTable.sortOrder))
      .limit(1);

    const facts = [
      row.status,
      row.price ? `${Number(row.price).toLocaleString("en-US")} د.ك` : null,
      row.areaName ?? row.govName,
      row.officeName,
    ].filter(Boolean);

    const blurb = String(row.descriptionAr ?? "").trim().replace(/\s+/g, " ");

    sendOg(res, {
      title: row.titleAr || DEFAULT_TITLE,
      description: blurb ? `${facts.join(" · ")} — ${blurb.slice(0, 140)}` : facts.join(" · "),
      // The office's own logo leads the card (the office brands its ad), then
      // the listing photo, then the site card.
      image: absolute(row.officeLogo) || absolute(image?.url) || DEFAULT_IMAGE,
      url,
    });
  } catch {
    sendOg(res, fallback);
  }
});

router.get("/og/office/:slug", async (req, res): Promise<void> => {
  const slug = String(req.params["slug"] ?? "");
  const url = `${SITE}/${slug}`;

  try {
    const [office] = await db
      .select({
        nameAr: officesTable.nameAr,
        descriptionAr: officesTable.descriptionAr,
        logo: officesTable.logo,
        coverImage: officesTable.coverImage,
      })
      .from(officesTable)
      .where(eq(officesTable.slug, slug))
      .limit(1);

    // Not an office slug (/contact, /saved, …) — keep the generic site card.
    if (!office) {
      sendOg(res, { title: DEFAULT_TITLE, description: DEFAULT_DESC, image: DEFAULT_IMAGE, url: SITE });
      return;
    }

    const blurb = String(office.descriptionAr ?? "").trim().replace(/\s+/g, " ");

    sendOg(res, {
      title: `${office.nameAr} | فايند`,
      description: blurb ? blurb.slice(0, 160) : `تصفح عقارات ${office.nameAr} على منصة فايند.`,
      image: absolute(office.logo) || absolute(office.coverImage) || DEFAULT_IMAGE,
      url,
    });
  } catch {
    sendOg(res, { title: DEFAULT_TITLE, description: DEFAULT_DESC, image: DEFAULT_IMAGE, url: SITE });
  }
});

export default router;
