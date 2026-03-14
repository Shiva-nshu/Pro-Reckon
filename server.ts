import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { initFirebase, isFirebaseConnected } from './server/config/firebase.js';
import leadRoutes from './lead-system/routes/leadRoutes.js';
import campaignRoutes from './server/routes/campaigns.js';
import dashboardRoutes from './server/routes/dashboard.js';
import { startScraperScheduler } from './lead-system/scheduler/scraperScheduler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  initFirebase();

  app.use('/api/leads', leadRoutes);
  app.use('/api/campaigns', campaignRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date(),
      dbStatus: isFirebaseConnected() ? 'connected' : 'disconnected',
    });
  });

  startScraperScheduler();

  // Static lead dashboard (simple HTML)
  app.use('/dashboard', express.static(path.join(__dirname, 'lead-system', 'dashboard')));
  app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'lead-system', 'dashboard', 'index.html'));
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
