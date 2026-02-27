import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cron from 'node-cron';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import Routes
import leadRoutes from './server/routes/leads.js';
import campaignRoutes from './server/routes/campaigns.js';
import dashboardRoutes from './server/routes/dashboard.js';

// Import Services (for scheduler)
import { runDailyScrape } from './server/services/scraperService.js';
import { processEmailQueue } from './server/services/emailService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Connect to MongoDB
  const MONGODB_URI = process.env.MONGODB_URI;
  if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
      .then(() => console.log('✅ Connected to MongoDB'))
      .catch(err => console.error('❌ MongoDB Connection Error:', err));
  } else {
    console.warn('⚠️ MONGODB_URI not found in environment variables. Database features will not work until configured.');
  }

  // API Routes
  app.use('/api/leads', leadRoutes);
  app.use('/api/campaigns', campaignRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date(),
      dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
  });

  // Scheduler (Cron Jobs)
  // Run scraping every day at midnight
  cron.schedule('0 0 * * *', () => {
    console.log('⏰ Running daily scrape job...');
    runDailyScrape();
  });

  // Process email queue every hour
  cron.schedule('0 * * * *', () => {
    console.log('⏰ Processing email queue...');
    processEmailQueue();
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
