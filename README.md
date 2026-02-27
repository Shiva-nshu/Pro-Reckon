<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ProReckon AI - Client Acquisition System

## 📌 Project Description
ProReckon AI is a comprehensive Client Acquisition System designed to automate lead generation, enrich prospect data, and manage email outreach campaigns. It includes a user-friendly frontend dashboard and a robust automated backend system to keep your client pipeline full.

### 🌟 Key Features
- **Dashboard & Analytics:** Track leads and campaigns from a centralized interface.
- **Lead Generation:** Automated daily web scraping to find new prospects.
- **Lead Enrichment:** Enhance lead data utilizing external enrichment APIs.
- **Email Campaigns:** Automated hourly email sequences to reach out to leads.
- **Consultation Booking:** A built-in public page to schedule consultations directly.

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
│   ├── models/         # Database models (Mongoose schemas)
│   └── services/       # Core business logic (emailService, scraperService, enrichmentService)
├── server.ts           # Express server setup and Cron job scheduler
├── package.json        # Project dependencies and npm scripts
└── .env.example        # Example environment variables file
```

## ⚙️ How It Works
1. **Frontend:** The React app provides a sleek UI to view metrics, manage leads, and set up campaigns.
2. **Backend:** The Express server handles API requests from the frontend and connects to a MongoDB database.
3. **Automation Scheduler:** 
   - A background cron job runs **every day at midnight** to scrape the web for new leads automatically.
   - Another job runs **every hour** to process the email queue and send outreach messages to the generated leads.
4. **AI Integration:** Uses Gemini AI for intelligent data extraction and processing.

## 🚀 Setting Up Locally

This guide is designed for beginners. Follow these steps carefully to run the application on your computer.

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (or a local MongoDB server) for the database.

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

# 3. Database: Your MongoDB Connection String
MONGODB_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/proreckon"

# 4. Email Configuration: Used to send automated campaign emails
# If using Gmail, you must generate an "App Password" from your Google Account settings
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# 5. Scraper (Optional): Proxy list if doing heavy scraping
PROXY_LIST="http://proxy1:8080,http://proxy2:8080"

# 6. Enrichment API: For finding more info about leads (e.g., Clearbit, Hunter.io)
ENRICHMENT_API_KEY="your_enrichment_api_key"
```

### 3. Start the Application
Once your `.env` is configured and everything is installed, start the app:
```bash
npm run dev
```

The application will start both the Express backend and the Vite frontend concurrently. You can then view the app in your browser at `http://localhost:3000`.
