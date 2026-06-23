# Workspace

## Overview

**Aqar (عقار)** — Arabic-first real estate marketplace platform for Kuwait and the Gulf region.
Full-stack pnpm monorepo using TypeScript.

## Public Office Pages

Each registered office gets a public page at `/:slug` (e.g. `/al-dar-real-estate`).
- `GET /api/offices/by-slug/:slug` — returns office data by slug
- `GET /api/slugs/check?slug=xxx` — returns `{available: boolean}` for uniqueness checks
- Registration (office role): custom slug can be chosen at signup with real-time validation + auto-suggestions from Arabic name transliteration
- Reserved slugs: properties, offices, admin, login, register, plans, dashboard, api, health, by-slug
- Dashboard shows a "صفحتك العامة" banner with copy + open buttons
- `OfficePage.tsx` renders header (logo, badges, description, contact), filter tabs (الكل/للبيع/للإيجار/للبدل), and paginated property cards

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 19 + Vite + Tailwind CSS v4 (artifact: `aqar-platform`, at `/`)
- **API server**: Express 5 (artifact: `api-server`, port from `$PORT` env)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- **Charts**: Recharts (dashboard analytics)
- **Build**: esbuild (CJS bundle)

## File Storage (Object Storage)

Replit App Storage (GCS-backed) is provisioned and configured for property images and office logos.

### Architecture
- **Upload flow**: Frontend requests presigned URL → uploads file directly to GCS → saves objectPath to DB
- **Serving**: `GET /api/storage/objects/{path}` streams objects with correct Content-Type headers
- **Client hook**: `useUpload` from `@workspace/object-storage-web` (wrapper around Uppy v5)

### Endpoints
- `POST /api/storage/uploads/request-url` — returns `{ uploadURL, objectPath }` (presigned PUT URL)
- `GET /api/storage/objects/:path` — serves stored objects
- `POST /api/properties/:id/images` — saves uploaded objectPath as property image record
- `PUT /api/offices/:id/logo` — updates office logo URL from objectPath
- `PUT /api/offices/:id/profile` — updates office description, phone, whatsapp

### Usage in Frontend
```typescript
const { uploadFile } = useUpload({ basePath: `${BASE}/api/storage` });
const result = await uploadFile(file); // { objectPath, uploadURL }
// Then save objectPath to DB via POST /api/properties/:id/images
```

## Packages

| Package | Path | Description |
|---|---|---|
| `@workspace/aqar-platform` | `artifacts/aqar-platform` | React frontend (Vite, RTL Arabic) |
| `@workspace/api-server` | `artifacts/api-server` | Express REST API |
| `@workspace/api-spec` | `lib/api-spec` | OpenAPI YAML spec (source of truth) |
| `@workspace/api-client-react` | `lib/api-client-react` | Generated React Query hooks + Zod schemas |
| `@workspace/api-zod` | `lib/api-zod` | Zod request/response schemas |
| `@workspace/db` | `lib/db` | Drizzle schema + DB client |
| `@workspace/object-storage-web` | `lib/object-storage-web` | Uppy v5 upload hook + ObjectUploader component |

## Design System

- **Theme**: Navy blue primary (`221 54% 23%`) + Gold accent (`45 68% 47%`)
- **Fonts**: Cairo, Tajawal (Google Fonts, RTL Arabic)
- **Direction**: RTL (`direction: rtl` on body, `dir="rtl"` on sections)
- **Currency**: KWD (Kuwaiti Dinar), formatted as `XXX,XXX KWD`
- **Status badges**: للإيجار=blue, للبيع=green, للبدل=orange
- **WhatsApp buttons**: `bg-green-500`, links to `wa.me/`

## Pages

### Public Pages
- `/` — Home with hero, smart search, featured properties, stats
- `/properties` — Property listing with sidebar filters (status, type, governorate, area, bedrooms, furnished, keyword)
- `/properties/:id` — Property detail with gallery, lead form, similar properties
- `/offices` — Office directory with governorate filter
- `/offices/:id` — Office profile with stats, properties, contact info
- `/plans` — Subscription plans pricing
- `/login` — Login page
- `/register` — Register page (user/office selection)

### Dashboard Pages (session-authenticated, uses real logged-in user's officeId)
- `/dashboard` — Overview stats, recent leads, top properties. Shows "حسابك قيد المراجعة" amber banner for pending accounts
- `/dashboard/listings` — Property listings table. Owners see all listings including inactive (pending) ones
- `/dashboard/listings/new` — Add new property form (POST /api/properties). Created listings are active=false (pending review)
- `/dashboard/leads` — Lead management with status update
- `/dashboard/analytics` — Charts (area chart, bar charts)

## API Routes

All routes under `/api/`:
- `GET /api/properties` — List with filters (status, type, governorateId, areaId, keyword, bedrooms, furnished, page, limit, sort)
- `GET /api/properties/featured` — Featured properties
- `GET /api/properties/latest` — Latest properties
- `GET /api/properties/:id` — Property detail with office info + images
- `GET /api/properties/:id/similar` — Similar properties
- `GET /api/offices` — List offices with filters
- `GET /api/offices/featured` — Featured offices
- `GET /api/offices/:id` — Office detail
- `GET /api/offices/:id/properties` — Office property listings
- `GET /api/offices/:id/stats` — Office analytics
- `POST /api/leads` — Create lead
- `GET /api/leads` — List leads (filtered by officeId)
- `PATCH /api/leads/:id` — Update lead status
- `GET /api/locations/governorates` — All governorates
- `GET /api/locations/areas` — Areas (filtered by governorateId)
- `GET /api/plans` — Subscription plans
- `GET /api/stats/platform` — Platform-wide stats
- `GET /api/stats/dashboard/:officeId` — Office dashboard stats
- `POST /api/auth/register` — Register user/office (hashes password with bcrypt, creates session)
- `POST /api/auth/login` — Login (sets session cookie `aqar.sid`)
- `POST /api/auth/logout` — Logout (destroys session)
- `GET /api/auth/me` — Get current session user
- `POST /api/properties` — Create property (requires session with officeId; active=false, approvalStatus=pending)
- `GET /api/admin/pending-offices` — Admin: list pending office registrations (role=admin required)
- `POST /api/admin/offices/:id/approve` — Admin: approve office (sets active=true, user status=active)
- `POST /api/admin/offices/:id/reject` — Admin: reject office (sets user status=rejected)
- `GET /api/admin/pending-listings` — Admin: list listings with approvalStatus=pending
- `POST /api/admin/listings/:id/approve` — Admin: approve listing (active=true, approvalStatus=approved)
- `POST /api/admin/listings/:id/reject` — Admin: reject listing (active=false, approvalStatus=rejected)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database

PostgreSQL accessed via `DATABASE_URL` env var. Tables:
- `governorates` — 6 Kuwait governorates
- `areas` — 45+ Kuwait areas linked to governorates
- `subscription_plans` — 3 plans (Basic 15 KWD, Pro 35 KWD, Premium 75 KWD)
- `offices` — Real estate offices with plan, governorate, social links
- `properties` — Property listings with all metadata (approvalStatus: pending/approved/rejected)
- `property_images` — Multiple images per property
- `leads` — Customer inquiries/leads

## Auth System

- `SESSION_SECRET` env var required by API server on startup
- Session cookie name: `aqar.sid`, 7-day expiry, httpOnly, sameSite=lax
- `src/lib/AuthContext.tsx` — React context that fetches `/api/auth/me` on mount, exposes `user`, `refetch()`, `logout()`
- Office registration: creates user (status=pending) + linked office (active=false, verified=false)
- After office registration → redirect to `/dashboard`; after user registration → redirect to `/`
- Login/Register pages call `refetch()` from AuthContext before navigating so dashboard has fresh user data
- Office properties endpoint checks session ownership: owners see all listings (active+inactive), public sees only active

## Admin Panel

- Route: `/admin` — only accessible to users with `role = 'admin'`
- Admin credentials: email `admin@aqar.kw`, password `Admin@12345` (seeded once via SQL)
- Two tabs: pending office approvals and pending listing approvals
- Approval flow: Office registers (user.status=pending, office.active=false) → admin approves (status=active, active=true)
- Listing flow: Office adds listing (active=false, approvalStatus=pending) → admin approves (active=true, approvalStatus=approved)
- Public properties only show where `active=true` (approved)
- Office dashboard shows ALL own listings including pending (active=false) with "قيد المراجعة" badge
- Rejected listings show "مرفوض" badge in office dashboard

## Notes

- Vite dev server proxies `/api/*` to the API server at `localhost:8080`
- The API server port is determined by `$PORT` env var (assigned by Replit)
- `inArray()` from drizzle-orm must be used instead of raw SQL `= any(...)` for array WHERE clauses
- Auth routes use plain validation (no zod imports) because esbuild cannot resolve `zod/v4` sub-path exports
