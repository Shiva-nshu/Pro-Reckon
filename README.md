
# ProReckon AI - Client Acquisition System

## 📌 Project Description
ProReckon AI is a Client Acquisition System that **finds the right clients** for ProReckon Solutions and surfaces **conversion-ready leads** that can be turned into paid customers. It does not send emails; it focuses on discovery, qualification, and showing the best leads to your team.

### 🌟 Key Features
- **Dashboard & Analytics:** Track total leads, qualified leads, hot (conversion-ready) leads, and conversion rate.
- **Lead Discovery:** Automated daily web scraping to find new prospects.
- **Lead Enrichment:** Enhance lead data with external enrichment APIs.
- **Qualification & Pipeline:** Score and prioritize leads (Cold / Warm / Hot) so you can focus on the ones most likely to convert.
- **Consultation Booking:** A built-in public page for consultations.

## 📂 Folder Structure
The project is organized into two main parts: the Frontend (`src`) and the Backend (`server`).

```text
proreckon-client-acquisition/
├── src/                # Frontend (React + Vite + Tailwind CSS)
│   ├── components/     # UI Components (Dashboard, LeadsList, Sidebar, etc.)
│   ├── App.tsx         # Main application routing
│   └── main.tsx        # React entry point
├── server/             # Backend (Node.js + Express)
│   ├── routes/         # API endpoints (leads, campaigns, dashboard)
│   ├── models/         # Firestore lead helpers and types
│   └── services/       # Core business logic (emailService, scraperService, enrichmentService)
├── server.ts           # Express server setup and Cron job scheduler
├── package.json        # Project dependencies and npm scripts
└── .env.example        # Example environment variables file
```

## ⚙️ How It Works
1. **Frontend:** The React app shows metrics, discovered leads, and pipeline status so ProReckon can see who is conversion-ready.
2. **Backend:** The Express server handles API requests and uses **Firebase Firestore** as the database.
3. **Automation:** A daily cron job (midnight) scrapes for new leads, enriches them, and scores them. No email sending — the app is built for finding and showing the right clients.
4. **AI:** Gemini AI is available for lead insights and future features.

## 🚀 Setting Up Locally

This guide is designed for beginners. Follow these steps carefully to run the application on your computer.

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- A [Firebase](https://console.firebase.google.com) project with **Firestore** enabled (replaces MongoDB).

### 1. Install Dependencies
Open your terminal, navigate to the project folder, and run:
```bash
npm install
```

### 2. Configure Environment Variables
You need to set up several APIs and credentials for the project to work fully. 

1. Create a new file named `.env` in the root directory. You can copy the contents from `.env.example`.
2. Fill in the following required properties in your `.env` file:

```env
# 1. Gemini AI: Required for intelligent data processing (Get it from Google AI Studio)
GEMINI_API_KEY="your_gemini_api_key"

# 2. App URL: The local or live URL of your app
APP_URL="http://localhost:3000"

# 3. Database: Firebase Firestore (use one of the two options)
# Option A: Path to service account JSON file
GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"
# Option B: Inline credentials
# FIREBASE_PROJECT_ID="your-project-id"
# FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com"
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# 4. (Email sending is disabled — app focuses on finding and showing conversion-ready leads.)

# 5. Scraper (Optional): Proxy list if doing heavy scraping
PROXY_LIST="http://proxy1:8080,http://proxy2:8080"

# 6. Enrichment API (optional): For finding more info about leads (e.g., Clearbit, Hunter.io)
ENRICHMENT_API_KEY="your_enrichment_api_key"
```

### 3. Start the Application
Once your `.env` is configured and everything is installed, start the app:
```bash
npm run dev
```

The application will start both the Express backend and the Vite frontend concurrently. You can then view the app in your browser at `http://localhost:3000`.
