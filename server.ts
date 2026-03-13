import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { initFirebase, isFirebaseConnected } from './server/config/firebase.js';

// Import Routes
import leadRoutes from './server/routes/leads.js';
import campaignRoutes from './server/routes/campaigns.js';
import dashboardRoutes from './server/routes/dashboard.js';

// Import Services (for scheduler)
import { runDailyScrape } from './server/services/scraperService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize Firebase Firestore (reads from env)
  initFirebase();

  // API Routes
  app.use('/api/leads', leadRoutes);
  app.use('/api/campaigns', campaignRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date(),
      dbStatus: isFirebaseConnected() ? 'connected' : 'disconnected',
    });
  });

  // Scheduler (Cron Jobs)
  // Run scraping every day at midnight
  cron.schedule('0 0 * * *', () => {
    console.log('⏰ Running daily scrape job...');
    runDailyScrape();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
