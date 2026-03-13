# APIs & External Services Needed for This Project

## 1. **Google Gemini API** (Required for AI emails)
- **Purpose:** Generates personalized cold email content for leads using AI.
- **Used in:** `server/services/emailService.ts`
- **Env:** `GEMINI_API_KEY`
- **Get it:** [Google AI Studio](https://aistudio.google.com/apikey)

---

## 2. **Firebase / Firestore** (Database)
- **Purpose:** Store leads, dashboard stats, and CRM data.
- **Used in:** All routes and services that read/write leads.
- **Env (choose one):**
  - **Option A:** `GOOGLE_APPLICATION_CREDENTIALS` = path to your service account JSON file.
  - **Option B:** `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (private key with `\n` for newlines in .env).
- **Get it:** [Firebase Console](https://console.firebase.google.com) → Project Settings → Service Accounts → Generate new private key. Enable **Firestore Database** for the project.

---

## 3. **SMTP (Email)** — Not used
- This app does **not** send emails. It focuses on finding and showing conversion-ready leads. No SMTP configuration needed.

---

## 4. **Enrichment API** (Optional – Clearbit, Hunter.io, etc.)
- **Purpose:** Enrich lead data (company size, tech stack, contacts) from website domain.
- **Used in:** `server/services/enrichmentService.ts`
- **Env:** `ENRICHMENT_API_KEY`
- **Options:** [Clearbit](https://clearbit.com), [Hunter.io](https://hunter.io), or similar. If not set, mock data is used.

---

## 5. **Proxy list** (Optional – for scraping)
- **Purpose:** Rotate IPs when scraping to avoid blocks.
- **Used in:** Referenced in `.env.example` for scraper configuration.
- **Env:** `PROXY_LIST` (comma-separated URLs)

---

## 6. **App URL** (Optional – for links in emails)
- **Purpose:** Base URL of the app (e.g. for booking links in emails).
- **Env:** `APP_URL`

---

## Summary Table

| API / Service   | Required? | Env Variable(s) |
|-----------------|-----------|------------------|
| Gemini AI       | Yes       | `GEMINI_API_KEY` |
| Firebase        | Yes       | See Firebase setup below |
| SMTP            | Yes (for real emails) | `SMTP_*` |
| Enrichment      | No (mock used) | `ENRICHMENT_API_KEY` |
| Proxy list      | No        | `PROXY_LIST` |
| App URL         | No        | `APP_URL` |
