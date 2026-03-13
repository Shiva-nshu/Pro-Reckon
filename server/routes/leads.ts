import express from 'express';
import { getFirestore, isFirebaseConnected } from '../config/firebase.js';
import * as leadFirestore from '../models/leadFirestore.js';
import { runDailyScrape } from '../services/scraperService.js';

const router = express.Router();

function withId(lead: leadFirestore.LeadRecord) {
  return { ...lead, _id: lead.id };
}

// GET all leads with pagination & filtering (dynamic from Firestore only)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority } = req.query;

    if (!getFirestore() || !isFirebaseConnected()) {
      return res.status(503).json({ error: 'Database not connected', leads: [], total: 0, pages: 0 });
    }

    const result = await leadFirestore.findLeads({
      page: Number(page),
      limit: Number(limit),
      status: status as string | undefined,
      priorityLevel: priority as string | undefined,
    });

    res.json({
      leads: result.leads.map(withId),
      total: result.total,
      pages: result.pages,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// POST create manual lead
router.post('/', async (req, res) => {
  try {
    if (!getFirestore() || !isFirebaseConnected()) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const lead = await leadFirestore.createLead(req.body);
    res.status(201).json(withId(lead));
  } catch (error) {
    res.status(400).json({ error: 'Failed to create lead' });
  }
});

// POST trigger scraper manually
router.post('/scrape', async (req, res) => {
  try {
    runDailyScrape().catch(console.error);
    res.json({ message: 'Scraping started in background' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start scraper' });
  }
});

export default router;
