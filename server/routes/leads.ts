import express from 'express';
import { getFirestore, isFirebaseConnected } from '../config/firebase.js';
import * as leadFirestore from '../models/leadFirestore.js';
import { runDailyScrape } from '../services/scraperService.js';

const router = express.Router();

function withId(lead: leadFirestore.LeadRecord) {
  return { ...lead, _id: lead.id };
}

/** Ensure every lead has scoreTier and numeric score for UI (dynamic for legacy leads). */
function normalizeLeadForResponse(lead: leadFirestore.LeadRecord) {
  const score = lead.qualificationScore ?? lead.score ?? 0;
  const scoreTier = lead.scoreTier ?? (score >= 70 ? 'Hot' as const : score >= 60 ? 'Qualified' as const : 'Low' as const);
  return { ...withId(lead), qualificationScore: score, score, scoreTier };
}

// GET all leads with pagination & filtering (dynamic from Firestore only)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, qualifiedOnly, tier } = req.query;

    if (!getFirestore() || !isFirebaseConnected()) {
      return res.status(503).json({ error: 'Database not connected', leads: [], total: 0, pages: 0 });
    }

    const result = await leadFirestore.findLeads({
      page: Number(page),
      limit: Number(limit),
      status: status as string | undefined,
      priorityLevel: priority as string | undefined,
      qualifiedOnly: qualifiedOnly === 'true' || qualifiedOnly === '1',
      tier: tier as leadFirestore.LeadTier | undefined,
    });

    res.json({
      leads: result.leads.map(normalizeLeadForResponse),
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
    res.status(201).json(normalizeLeadForResponse(lead));
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

// POST seed demo leads (for showing value without real scrape)
router.post('/seed-demo', async (req, res) => {
  try {
    if (!getFirestore() || !isFirebaseConnected()) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    // Score variety: ~75 Hot, ~65 Qualified, ~35 Low (demo scoring rules)
    const demoLeads: leadFirestore.LeadData[] = [
      { companyName: 'ABC Industries', industry: 'Manufacturing', location: 'Ahmedabad', website: 'https://abcmfg.com', phone: '9876543210', enrichmentData: { employeeCount: 50 } },
      { companyName: 'XYZ Realty', industry: 'Real Estate', location: 'Other', website: 'https://xyzrealty.com', phone: '9876543211', enrichmentData: { employeeCount: 80 } },
      { companyName: 'Random Store', industry: 'Technology', location: 'Small Town', website: 'https://randomstore.in' },
    ];
    const created = await Promise.all(demoLeads.map((d) => leadFirestore.createLead(d)));
    res.status(201).json({ message: 'Demo leads added', leads: created.map(normalizeLeadForResponse) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed demo leads' });
  }
});

export default router;
