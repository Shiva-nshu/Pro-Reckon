# Where to Get Everything for Your `.env` File

Copy `.env.example` to `.env`, then fill in each value using the links below.

---

## Required

### 1. **GEMINI_API_KEY** (AI for lead insights)
| | |
|---|---|
| **Where to register** | [Google AI Studio](https://aistudio.google.com/apikey) |
| **Steps** | Sign in with Google → “Get API key” / “Create API key” → copy the key |
| **Free tier** | Yes (with limits) |

---

### 2. **Firebase (database)** – `GOOGLE_APPLICATION_CREDENTIALS`
| | |
|---|---|
| **Where to register** | [Firebase Console](https://console.firebase.google.com) |
| **Steps** | 1. Create a project (or use existing).<br>2. Enable **Firestore Database** (Build → Firestore Database → Create database).<br>3. **Project Settings** (gear) → **Service accounts** → **Generate new private key** → download the JSON.<br>4. Save the file as `serviceAccountKey.json` in your project root and set `GOOGLE_APPLICATION_CREDENTIALS="serviceAccountKey.json"` in `.env`. |
| **Free tier** | Yes (Firestore has a free quota) |

---

### 3. **No email sending**
This app does not send emails; no SMTP needed.

---

## Optional

### 4. **ENRICHMENT_API_KEY** (richer lead data)
| | |
|---|---|
| **Where to register** | [Hunter.io](https://hunter.io) or [Clearbit](https://clearbit.com) |
| **Steps** | Sign up → get API key from dashboard / API section → put in `.env` as `ENRICHMENT_API_KEY="..."`. |
| **Note** | If you leave it blank, the app uses mock enrichment data. |

---

### 5. **APP_URL**
| | |
|---|---|
| **What it is** | The public URL of your app (e.g. `http://localhost:3000` or `https://yourapp.com`). |
| **Where** | No registration – you choose it. Use `http://localhost:3000` for local dev. |

---

### 6. **PROXY_LIST**
| | |
|---|---|
| **What it is** | Comma-separated proxy URLs for the scraper (e.g. `http://proxy1:8080,http://proxy2:8080`). |
| **Where** | Optional. You’d get these from a proxy provider (e.g. [Bright Data](https://brightdata.com), [Oxylabs](https://oxylabs.io), or your own proxies). Leave empty if you don’t use proxies. |

---

## Quick checklist

- [ ] **GEMINI_API_KEY** – [Google AI Studio](https://aistudio.google.com/apikey)
- [ ] **Firebase** – [Firebase Console](https://console.firebase.google.com) → Firestore + Service account key → `serviceAccountKey.json` + `GOOGLE_APPLICATION_CREDENTIALS`
- [ ] **ENRICHMENT_API_KEY** (optional) – [Hunter.io](https://hunter.io) or [Clearbit](https://clearbit.com)
- [ ] **APP_URL** – e.g. `http://localhost:3000`
- [ ] **PROXY_LIST** (optional) – only if you use proxies
