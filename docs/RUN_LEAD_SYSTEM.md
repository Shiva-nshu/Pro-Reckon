# ProReckon Lead System — Run & Test Guide

## What Was Implemented

- **Lead discovery**: Scrapers for IndiaMart, TradeIndia, JustDial, Google Maps, MCA, Startups (demo data; plug in real URLs via env).
- **Lead qualification**: Scoring 0–100 and tiers (Hot Lead ≥70, Qualified Lead ≥60, Low Priority <60).
- **Storage**: Firebase Firestore with duplicate detection on `companyName` + `website`.
- **Pipeline**: Scraper → Normalize → Score → Save, with retries and error handling.
- **APIs**: `GET /api/leads`, `GET /api/leads?minScore=60`, `GET /api/leads?source=indiamart`, `POST /api/leads/scrape/run`.
- **Scheduler**: node-cron every 12 hours (configurable via `SCRAPER_CRON`).
- **Dashboards**: React app (Dashboard + Leads list with filters) and static HTML at `/dashboard`.

## How to Run Locally

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set environment**
   - Copy `.env.example` to `.env`.
   - Set Firebase credentials: `GOOGLE_APPLICATION_CREDENTIALS` (path to service account JSON) or `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.  
   - If Firebase is not configured, the server still starts; lead APIs and dashboard will return "Database not connected".

3. **Start the server**
   ```bash
   npm run dev
   ```
   Or: `npx tsx server.ts`

4. **Open the app**
   - Main app: http://localhost:3000  
   - Static lead dashboard: http://localhost:3000/dashboard  

## How to Trigger Scraping

- **From UI**: Click "Run Scraping" on the Leads page or "Run Scraper" on the Dashboard.
- **From API**: `POST http://localhost:3000/api/leads/scrape/run` (or `POST /api/leads/scrape`).
- **Automatic**: Scraping runs every 12 hours via the scheduler (override with `SCRAPER_CRON` in `.env`).

## How to View the Dashboard

- **React dashboard**: http://localhost:3000 — Dashboard (KPIs + charts), Leads (table with filters).
- **Static dashboard**: http://localhost:3000/dashboard — Table with filters: Score ≥60 (Qualified), Score ≥70 (Hot), and by source.

## Quick Tests

1. **Scraper returns at least 10 leads**  
   Run the pipeline once (e.g. trigger scrape from UI). Check server logs for lines like `[IndiaMart] Extracted 3 leads` and similar; total across sources should be ≥10.

2. **Leads saved in Firestore**  
   After scraping, open http://localhost:3000/leads or http://localhost:3000/dashboard and confirm rows appear.

3. **Score calculation**  
   In the Leads table, confirm Score and Tier columns (Hot = green, Qualified = yellow, Low = red).

4. **Score filter**  
   Use "≥ 60 (Qualified)" and "≥ 70 (Hot)" and confirm only matching leads show.

5. **Source filter**  
   Use the source dropdown and confirm only leads from that source appear.

## Folder Structure (lead-system)

```
lead-system/
  config/db.ts           # Firebase init (re-exports from server config)
  models/Lead.ts         # Lead schema in Firestore (companyName + website duplicate check)
  services/
    leadScoring.ts       # 0–100 score, tier, qualifiedForOutreach
    leadNormalizer.ts    # Normalize raw scraped data
    leadPipeline.ts      # Scraper → Normalize → Score → Save
  scrapers/
    index.ts             # runAllScrapers()
    indiamart.ts, tradeindia.ts, justdial.ts, googlemaps.ts, mca.ts, startups.ts
  routes/leadRoutes.ts
  controllers/leadController.ts
  scheduler/scraperScheduler.ts   # node-cron every 12h
  dashboard/
    index.html
    dashboard.js
```

## Environment Variables (lead-system)

| Variable | Purpose |
|----------|--------|
| `GOOGLE_APPLICATION_CREDENTIALS` or `FIREBASE_*` | Firebase Firestore credentials (see .env.example) |
| `SCRAPER_CRON` | Cron schedule (default: `0 */12 * * *` = every 12 hours) |
| `SCRAPER_DELAY_MS` | Delay between scraper requests (default: 2000) |
| `TARGET_CITIES` | Comma-separated cities for +10 location score |

Optional scraper URLs (for real scraping when configured):  
`INDIAMART_SAMPLE_URL`, `TRADEINDIA_SAMPLE_URL`, `JUSTDIAL_SAMPLE_URL`.
