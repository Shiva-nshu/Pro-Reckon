# ProReckon — Intent → Qualification → Outreach Flow

This app implements the **AI Funding Client Acquisition** flow so leads are **quality-first**, not bulk-first.

**What is a “lead”?**  
A lead = **a company + the person(s) to contact** (name, role, email) — i.e. who ProReckon can target and reach to pitch loans/funding services. The system finds both the right companies (ICP) and the right people at those companies.

## Flow (no more “scrape → blast → 0%”)

1. **Find leads (people to pitch to)** — Use Hunter **Discover** (country + industry) to find companies matching ICP, or a manual domain list. For each company, **Domain Search** fetches contact people (name, role, email). Each lead = company + contact person to reach.
2. **Filter qualified leads** — Every lead gets a **qualification score (0–100)**. Only leads with **score ≥ 60** are “Qualified for outreach”.
3. **Personalized outreach** — (When you enable it) Only qualified leads are contacted; no bulk cold email.
4. **Follow-up + CRM** — Pipeline by status (New → Contacted → Interested → Meeting → Converted).

## Demo qualification scoring (0–100)

| Signal | Points |
|--------|--------|
| Target industry | +25 |
| Website exists | +10 |
| Phone exists | +10 |
| Business category MSME | +20 |
| Located in target city | +10 |
| Export / manufacturing keyword | +25 |

**Tiers (dashboard):**  
- 🟢 **Hot** — 70+ (prioritize first)  
- 🟡 **Qualified** — 60–69 (ready for outreach)  
- 🔴 **Low** — &lt;60  

**Target cities** and industries are configurable via `TARGET_CITIES` (env) and built-in lists.

## ICP tiers (internal)

- **Tier1** — Target industries (Manufacturing, Real Estate, Construction, Jewellery, E‑commerce, Trading, etc.).
- **Tier2** — Has contact (email/phone).
- **Tier3** — Other.

## Where it happens in the app

- **Lead discovery** — `LEAD_SOURCE_DOMAINS` + Hunter.io Company API; each lead is scored and tiered on create.
- **Dashboard** — “Qualified for outreach (60+)”, “Hot (70+)”, ICP Tier chart, pipeline by status.
- **Leads list** — Qualification score, Tier, and “Qualified for outreach (60+)” filter so you only work quality leads.

## Core services (ProReckon)

- Business financing (loans, cash credit, LAP)
- Financial advisory (credit score, eligibility, schemes)
- Personal loans (home, personal, education, auto)

Target: MSMEs, manufacturers, builders, import/export, growing startups — i.e. businesses that **need funding**, not random cold lists.
