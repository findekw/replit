# Production Database Setup Guide

This guide explains how to create a free PostgreSQL database on Neon.tech
and connect it to your Vercel deployment.

---

## Step 1 — Create a Neon Database

1. Go to **https://neon.tech** and sign up (free, no credit card needed)
2. Click **"New Project"**
3. Fill in:
   - **Project name**: `finde-prod` (or any name)
   - **Database name**: `findekw`
   - **Region**: choose the closest to your users (e.g. `eu-central-1` for Gulf)
4. Click **"Create Project"**
5. On the next screen, copy the **Connection String** — it looks like:
   ```
   postgresql://user:password@ep-xxx-xxx.eu-central-1.aws.neon.tech/findekw?sslmode=require
   ```
   > Save this — you'll need it in Step 3 and Step 4.

---

## Step 2 — Push the Schema to Neon

Run this command from your **Replit Shell** (replace the URL with your Neon URL):

```bash
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/findekw?sslmode=require" \
  pnpm --filter @workspace/db run push
```

This creates all the tables automatically using Drizzle ORM.

---

## Step 3 — Seed Required Data

After pushing the schema, run this SQL in the **Neon SQL Editor**
(go to your Neon project → **SQL Editor** tab):

```sql
-- ── Countries ────────────────────────────────────────────────────────────────
INSERT INTO countries (name, name_ar, code, enable_badal, active)
VALUES ('Kuwait', 'الكويت', 'KW', true, true)
ON CONFLICT (code) DO NOTHING;

-- ── Governorates ─────────────────────────────────────────────────────────────
INSERT INTO governorates (name, name_ar, country_code, active) VALUES
  ('Capital',       'العاصمة',       'KW', true),
  ('Hawalli',       'حولي',          'KW', true),
  ('Farwaniya',     'الفروانية',     'KW', true),
  ('Mubarak Al-Kabeer', 'مبارك الكبير', 'KW', true),
  ('Ahmadi',        'الأحمدي',       'KW', true),
  ('Jahra',         'الجهراء',       'KW', true)
ON CONFLICT DO NOTHING;

-- ── Areas (mapped to governorate IDs 1–6) ────────────────────────────────────
INSERT INTO areas (name, name_ar, governorate_id, active) VALUES
  -- العاصمة (1)
  ('Sharq',         'شرق',           1, true),
  ('Mirqab',        'المرقاب',       1, true),
  ('Dasman',        'دسمان',         1, true),
  ('Salmiya',       'السالمية',      1, true),
  ('Abdullah Al-Salem', 'عبدالله السالم', 1, true),
  -- حولي (2)
  ('Hawalli',       'حولي',          2, true),
  ('Rumaithiya',    'الرميثية',      2, true),
  ('Salwa',         'سلوى',          2, true),
  ('Bayan',         'بيان',          2, true),
  ('Mishref',       'مشرف',          2, true),
  ('Jabriya',       'الجابرية',      2, true),
  ('Surra',         'السرة',         2, true),
  -- الفروانية (3)
  ('Farwaniya',     'الفروانية',     3, true),
  ('Khaitan',       'خيطان',         3, true),
  ('Ardiya',        'العارضية',      3, true),
  ('Rai',           'الري',          3, true),
  ('Firdous',       'الفردوس',       3, true),
  ('Andalous',      'الأندلس',       3, true),
  -- مبارك الكبير (4)
  ('Mubarak Al-Kabeer', 'مبارك الكبير', 4, true),
  ('Abu Halifa',    'أبو حليفة',     4, true),
  ('Qurain',        'القرين',        4, true),
  ('Fnaitees',      'الفنيطيس',      4, true),
  ('Sabah Al-Salem', 'صباح السالم',  4, true),
  -- الأحمدي (5)
  ('Ahmadi',        'الأحمدي',       5, true),
  ('Mangaf',        'المنقف',        5, true),
  ('Fahaheel',      'الفحيحيل',      5, true),
  ('Mahboula',      'المهبولة',      5, true),
  ('Abu Fatira',    'أبو فطيرة',     5, true),
  ('Fintas',        'الفنطاس',       5, true),
  ('Sabahiya',      'الصباحية',      5, true),
  -- الجهراء (6)
  ('Jahra',         'الجهراء',       6, true),
  ('Sulaibiya',     'الصليبية',      6, true),
  ('Qasr',          'القصر',         6, true),
  ('Waha',          'الواحة',        6, true)
ON CONFLICT DO NOTHING;

-- ── Subscription Plans ───────────────────────────────────────────────────────
INSERT INTO subscription_plans
  (name, name_ar, price, currency, max_listings, featured_listings,
   has_lead_dashboard, has_analytics, has_whatsapp_support,
   has_priority_placement, has_custom_profile, features, active)
VALUES
  ('Basic', 'أساسي', 15, 'KWD', 10, 0,
   false, false, false, false, false,
   ARRAY['10 إعلانات نشطة', 'صفحة مكتب', 'دعم بريد إلكتروني'],
   true),
  ('Pro', 'احترافي', 35, 'KWD', 30, 3,
   true, false, true, false, true,
   ARRAY['30 إعلانات نشطة', 'إعلانات مميزة', 'لوحة العملاء المحتملين', 'دعم واتساب', 'صفحة مخصصة'],
   true),
  ('Premium', 'بريميوم', 75, 'KWD', 100, 10,
   true, true, true, true, true,
   ARRAY['إعلانات غير محدودة', 'أولوية الظهور', 'تحليلات متقدمة', 'دعم واتساب VIP', 'كل مميزات Pro'],
   true)
ON CONFLICT DO NOTHING;

-- ── Admin User ───────────────────────────────────────────────────────────────
-- Password: Admin@12345  (bcrypt hash below)
INSERT INTO users (name, email, password_hash, role, status)
VALUES (
  'مدير النظام',
  'admin@aqar.kw',
  '$2b$12$LQv3c1yqBwlVHpPjrg1C8O7dqpS4p4t6P3nB5F8rU2kW1yH9mE7Xi',
  'admin',
  'active'
)
ON CONFLICT (email) DO NOTHING;
```

> **Note:** The admin password hash above is a placeholder. The actual hash
> will be set automatically on first deployment via `ensureAdmin()` in the
> server startup code.

---

## Step 4 — Add Environment Variables to Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/findekw?sslmode=require` | Your Neon connection string from Step 1 |
| `SESSION_SECRET` | Any long random string, e.g. `finde-secret-2026-xK9mP2qR` | Used to sign session cookies |
| `NODE_ENV` | `production` | Enables secure cookies + production mode |
| `ALLOWED_ORIGINS` | `https://your-frontend.vercel.app` | Your frontend URL (add later after frontend deploys) |

---

## Step 5 — Redeploy on Vercel

After adding the environment variables:

1. Go to Vercel → **Deployments**
2. Click **"..."** on the latest deployment → **Redeploy**
3. Wait for it to finish (~1 minute)
4. Test the API:
   ```
   https://finde-dev-api-server.vercel.app/api/health
   ```
   Expected response:
   ```json
   { "status": "ok", "db": "ok", "uptimeSeconds": 1 }
   ```

---

## Troubleshooting

| Error | Fix |
|---|---|
| `SSL connection required` | Make sure your Neon URL ends with `?sslmode=require` |
| `relation "users" does not exist` | Run Step 2 (drizzle push) again |
| `FUNCTION_INVOCATION_FAILED` | Check all 3 env vars are set in Vercel |
| `CORS blocked` | Add your frontend URL to `ALLOWED_ORIGINS` in Vercel |
